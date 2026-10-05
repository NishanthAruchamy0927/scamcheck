import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import rateLimit from 'express-rate-limit';
import { handleInvestigate } from '../controllers/investigationController.js';
import { handleCompare } from '../controllers/comparisonController.js';
import { handleCompanyCheck } from '../controllers/companyCheckController.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { DEMO_CASES } from '../data/demoCases.js';
import { getEntityIntelligenceHandler, getInvestigationGraphHandler } from '../controllers/graphController.js';
import { getCampaignsHandler, getCampaignDetailsHandler, reviewCampaignHandler } from '../controllers/campaignController.js';
import { getThreatIntelDashboardHandler, getThreatIndicatorHandler } from '../controllers/threatIntelController.js';
import { getPaymentAssessmentHandler, getRelatedInvestigationsHandler, reportPaymentHandler } from '../controllers/paymentController.js';

const router = express.Router();

// Analysis endpoints run OCR, document parsing and outbound verification calls,
// so they are rate limited per IP to keep one client from exhausting the server.
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.ANALYSIS_RATE_LIMIT_PER_MIN) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please wait a minute and try again.' }
});

// Multer storage in OS temp directory with strict validation (Phase 5)
const upload = multer({
  dest: path.join(os.tmpdir(), 'scamcheck-uploads'),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Strictly allowed MIME types
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'text/plain'
    ];
    
    // Explicitly check extensions to prevent MIME spoofing bypasses
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed. Only PNG, JPEG, PDF, DOCX, and TXT are supported.`));
    }
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`File extension ${ext} is not allowed.`));
    }

    cb(null, true);
  }
});

// Primary Investigation Endpoint (Supports text, document upload, screenshot OCR, or URL)
// Accepts either a single 'file' (legacy) or multiple 'files' (multimodal)
const investigationUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 5 }
]);

router.post('/investigate', analysisLimiter, optionalAuthenticate, (req, res, next) => {
  // Upload rejections (bad type, too large, too many files) are client errors, not 500s
  investigationUpload(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? `Upload rejected: ${err.message}`
        : err instanceof Error ? err.message : 'Upload rejected';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}, handleInvestigate);

// Comparison Endpoint (Side-by-side comparative analysis)
router.post('/compare', analysisLimiter, optionalAuthenticate, handleCompare);

// Company credibility (LinkedIn footprint) & student career-value check
router.post('/company-check', analysisLimiter, optionalAuthenticate, handleCompanyCheck);

import { getInvestigations, getInvestigationById } from '../controllers/investigationDataController.js';

// Authenticated endpoints for retrieving investigations
router.get('/investigations', authenticate, getInvestigations);
router.get('/investigations/:id', authenticate, getInvestigationById);

// Phase 7: Graph APIs
router.get('/graph/entity/:entityId', authenticate, getEntityIntelligenceHandler);
router.get('/graph/investigation/:investigationId', authenticate, getInvestigationGraphHandler);

// Phase 8: Threat Intel & Campaigns
router.get('/threat-intelligence', authenticate, getThreatIntelDashboardHandler);
router.get('/threat-intelligence/:id', authenticate, getThreatIndicatorHandler);
router.get('/campaigns', authenticate, getCampaignsHandler);
router.get('/campaigns/:campaignId', authenticate, getCampaignDetailsHandler);
router.post('/campaigns/:campaignId/review', authenticate, reviewCampaignHandler);

// Phase 9: Payment Security Intelligence
router.get('/payments/:id/assessment', authenticate, getPaymentAssessmentHandler);
router.get('/payments/:id/related-investigations', authenticate, getRelatedInvestigationsHandler);
router.post('/payments/:id/report', authenticate, reportPaymentHandler);

// Demo Opportunities Catalog
router.get('/demos', (_req, res) => {
  res.status(200).json(DEMO_CASES);
});

router.get('/demos/:id', (req, res) => {
  const demo = DEMO_CASES.find((d) => d.id === req.params.id);
  if (!demo) {
    res.status(404).json({ error: 'Demo opportunity not found' });
    return;
  }
  res.status(200).json(demo);
});

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'SCAMCHECK AI Opportunity Intelligence',
    version: '1.0.0',
    engineStatus: 'READY',
    timestamp: new Date().toISOString()
  });
});

export default router;
