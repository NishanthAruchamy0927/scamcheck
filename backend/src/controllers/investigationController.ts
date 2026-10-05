import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import { persistInvestigationResult } from '../services/investigationService.js';
import { extractEntities } from '../engine/entityExtractor.js';
import { evaluateScamPatterns } from '../engine/patternEngine.js';
import { evaluateOrgConsistency } from '../engine/orgConsistency.js';
import { calculatePotentialExposure } from '../engine/exposureCalculator.js';
import { evaluateConfidence } from '../engine/confidenceEngine.js';
import { aggregateInvestigation } from '../engine/riskAggregator.js';
import { parseDocumentFile } from '../parsers/documentParser.js';
import { extractTextFromImage } from '../parsers/ocrParser.js';
import { analyzeUrlTarget } from '../parsers/urlParser.js';
import { InvestigationReport } from '../engine/types.js';
import { analyzeWithML } from '../services/mlService.js';
import { decodeQrFromImage } from '../engine/payment/qrDecoder.js';
import { evaluateCompanyCredibility } from '../engine/companyCredibility.js';

import crypto from 'crypto';
import { extractMultimodalEntities } from '../engine/multimodalExtractor.js';
import { MultimodalContent, NormalizedInput, ExtractedEntity } from '../engine/types.js';

/** Errors caused by the submitted content itself; reported to the client as 400s. */
class InvalidSubmissionError extends Error {}

/**
 * Verifies the file's leading bytes match its declared type, so renamed or
 * corrupt files are rejected up front instead of failing deep inside a parser.
 */
function assertFileSignature(file: Express.Multer.File): void {
  const fd = fs.openSync(file.path, 'r');
  const header = Buffer.alloc(8);
  let bytesRead = 0;
  try {
    bytesRead = fs.readSync(fd, header, 0, header.length, 0);
  } finally {
    fs.closeSync(fd);
  }
  const head = header.subarray(0, bytesRead);
  const startsWith = (bytes: number[]) => bytes.every((b, i) => head[i] === b);

  let valid = true;
  if (file.mimetype === 'image/png') valid = startsWith([0x89, 0x50, 0x4e, 0x47]);
  else if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') valid = startsWith([0xff, 0xd8, 0xff]);
  else if (file.mimetype === 'application/pdf') valid = startsWith([0x25, 0x50, 0x44, 0x46]); // %PDF
  else if (file.mimetype.includes('wordprocessingml')) valid = startsWith([0x50, 0x4b, 0x03, 0x04]); // ZIP container

  if (!valid) {
    throw new InvalidSubmissionError(
      `"${file.originalname}" does not look like a valid ${file.mimetype} file. It may be corrupt or renamed.`
    );
  }
}

export async function handleInvestigate(req: AuthRequest, res: Response): Promise<void> {
  const uploadedFiles: Express.Multer.File[] = [];

  try {
    let combinedSnippet = '';
    let primaryInputMode: 'text' | 'document' | 'image' | 'url' | 'mixed' = 'text';

    const multimodalContext: MultimodalContent = {
      inputs: [],
      content: { text: '', entities: [] },
      metadata: { ocrUsed: false, fileHashes: [] }
    };

    // 1. Check for File Upload (Legacy single file or new multiple files)
    if (req.file) uploadedFiles.push(req.file);
    if (req.files && typeof req.files === 'object') {
      if (Array.isArray((req.files as any).files)) {
        uploadedFiles.push(...(req.files as any).files);
      }
      if (Array.isArray((req.files as any).file) && !req.file) {
        uploadedFiles.push(...(req.files as any).file);
      }
    }

    if (uploadedFiles.length > 0) {
      primaryInputMode = uploadedFiles.length > 1 ? 'mixed' : 'document';
      
      for (const file of uploadedFiles) {
        assertFileSignature(file);
        const mime = file.mimetype;
        const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
        multimodalContext.metadata.fileHashes!.push(fileHash);

        let extractedText = '';
        let sourceVal: ExtractedEntity['source'] = 'UNKNOWN';

        if (mime.startsWith('image/')) {
          if (uploadedFiles.length === 1) primaryInputMode = 'image';
          
          // Phase 9: QR Extraction
          const qrResult = await decodeQrFromImage(file.path);
          if (qrResult) {
            multimodalContext.content.entities.push({
              type: 'QR_PAYLOAD',
              value: qrResult.payload,
              normalizedValue: qrResult.payload,
              source: 'QR_DECODER',
              confidence: qrResult.confidence !== null ? qrResult.confidence * 100 : 0
            });
            // Extract UPI URL if it's a UPI payload
            if (qrResult.payload.startsWith('upi://')) {
              multimodalContext.content.entities.push({
                type: 'UPI_URL',
                value: qrResult.payload,
                normalizedValue: qrResult.payload,
                source: 'QR_PAYLOAD',
                confidence: qrResult.confidence !== null ? qrResult.confidence * 100 : 0
              });
            }
          }

          try {
            extractedText = await extractTextFromImage(file.path);
          } catch (err: any) {
            throw new InvalidSubmissionError(`Could not read text from "${file.originalname}": ${err.message}`);
          }
          multimodalContext.metadata.ocrUsed = true;
          sourceVal = 'OCR';
          multimodalContext.inputs.push({ type: 'IMAGE', originalName: file.originalname });
        } else {
          try {
            extractedText = await parseDocumentFile(file.path, mime, file.originalname);
          } catch (err: any) {
            throw new InvalidSubmissionError(`Could not read "${file.originalname}": ${err.message}`);
          }
          sourceVal = mime === 'application/pdf' ? 'PDF' : mime === 'text/plain' ? 'TEXT' : 'DOCX';
          multimodalContext.inputs.push({ type: sourceVal, originalName: file.originalname });
        }

        // Entity extraction per artifact
        const fileEntities = extractMultimodalEntities(extractedText, sourceVal);
        multimodalContext.content.entities.push(...fileEntities);

        combinedSnippet += `\n[--- START ${file.originalname} ---]\n${extractedText}\n[--- END ${file.originalname} ---]\n`;
      }
    }

    // Process Text / URL from body
    if (req.body.url && typeof req.body.url === 'string' && req.body.url.trim().length > 0) {
      if (primaryInputMode === 'text') primaryInputMode = 'url';
      else primaryInputMode = 'mixed';
      
      const targetUrl = req.body.url.trim();
      const urlAnalysis = await analyzeUrlTarget(targetUrl);
      const urlText = urlAnalysis.text;
      
      multimodalContext.inputs.push({ type: 'URL', originalName: targetUrl });
      const urlEntities = extractMultimodalEntities(urlText, 'URL');
      multimodalContext.content.entities.push(...urlEntities);
      
      combinedSnippet += `\n[--- START URL EXTRACT ---]\n${urlText}\n[--- END URL EXTRACT ---]\n`;
    } 
    
    if (req.body.text && typeof req.body.text === 'string' && req.body.text.trim().length > 0) {
      if (primaryInputMode === 'text' && uploadedFiles.length === 0 && !req.body.url) {
        primaryInputMode = 'text';
      } else {
        primaryInputMode = 'mixed';
      }
      
      const rawText = req.body.text;
      multimodalContext.inputs.push({ type: 'TEXT' });
      const textEntities = extractMultimodalEntities(rawText, 'TEXT');
      multimodalContext.content.entities.push(...textEntities);
      
      combinedSnippet += `\n[--- START TEXT INPUT ---]\n${rawText}\n[--- END TEXT INPUT ---]\n`;
    }

    const inputSnippet = combinedSnippet.trim();
    multimodalContext.content.text = inputSnippet;

    if (!inputSnippet) {
      res.status(400).json({
        error: 'Unable to extract readable content from this submission. Please verify the document or image contains readable text.'
      });
      return;
    }

    // 2. Run Engine Pipeline
    const entities = extractEntities(inputSnippet);
    const signals = evaluateScamPatterns(inputSnippet, entities);
    const orgConsistency = evaluateOrgConsistency(inputSnippet, entities);
    const potentialExposure = calculatePotentialExposure(entities, signals);
    const confidence = evaluateConfidence(inputSnippet, entities, signals, orgConsistency);

    // Phase 4: Machine Learning Inference
    const tempDeterministicScore = signals.reduce((acc, s) => acc + s.weight, 0);
    const mlAnalysis = await analyzeWithML(inputSnippet, tempDeterministicScore);

    const report: InvestigationReport = await aggregateInvestigation(
      inputSnippet,
      primaryInputMode === 'mixed' ? 'document' : primaryInputMode, // Fallback for enum
      entities,
      signals,
      orgConsistency,
      potentialExposure,
      confidence.confidenceScore,
      confidence.confidenceRationale,
      confidence.uncertainty,
      mlAnalysis
    );
    
    // Attach Phase 5 context
    report.multimodal = multimodalContext;

    // Company credibility (LinkedIn footprint) & career value for students
    const linkedinUrl = typeof req.body.linkedinUrl === 'string' ? req.body.linkedinUrl.trim().slice(0, 300) : undefined;
    let linkedinFacts: unknown = req.body.linkedinFacts;
    if (typeof linkedinFacts === 'string') {
      // multipart/form-data submissions send nested objects as JSON strings
      try {
        linkedinFacts = JSON.parse(linkedinFacts);
      } catch {
        linkedinFacts = undefined;
      }
    }
    try {
      report.companyCredibility = await evaluateCompanyCredibility({
        text: inputSnippet,
        entities,
        riskTier: report.riskTier,
        linkedinUrl: linkedinUrl || undefined,
        linkedinFacts: linkedinFacts as any
      });
    } catch (err) {
      console.error('Company credibility check failed:', err);
    }

    // Phase 2: Persist investigation to PostgreSQL in the background; the student
    // gets the report immediately and a slow or absent database never delays it.
    void persistInvestigationResult(
      typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 200) : 'Untitled Investigation',
      // Store the concrete primary input (PDF, IMAGE, DOCX, URL, TEXT) rather than the generic "document"
      multimodalContext.inputs[0]?.type ?? 'TEXT',
      inputSnippet,
      report,
      entities,
      req.user?.id
    );

    res.status(200).json(report);
  } catch (error: any) {
    if (error instanceof InvalidSubmissionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Investigation error:', error);
    res.status(500).json({
      error: 'Investigation could not be completed. Please try again.',
      details: error.message
    });
  } finally {
    // Clean up all temporary uploaded files from disk safely
    for (const file of uploadedFiles) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup error
        }
      }
    }
  }
}
