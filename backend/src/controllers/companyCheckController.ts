import { Request, Response } from 'express';
import { extractEntities } from '../engine/entityExtractor.js';
import { evaluateScamPatterns } from '../engine/patternEngine.js';
import { evaluateOrgConsistency } from '../engine/orgConsistency.js';
import { evaluateCompanyCredibility } from '../engine/companyCredibility.js';
import { RiskTier } from '../engine/types.js';

const MAX_TEXT_LENGTH = 20_000;

/**
 * POST /api/company-check
 * Body: { companyName?, linkedinUrl?, offerText?, linkedinFacts? }
 * Rates how credible a company is (LinkedIn footprint) and whether its
 * internship / certificate program is actually useful for a student's career.
 */
export async function handleCompanyCheck(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  const companyName = str(body.companyName, 120);
  const linkedinUrl = str(body.linkedinUrl, 300);
  const offerText = str(body.offerText, MAX_TEXT_LENGTH);

  if (!companyName && !linkedinUrl && !offerText) {
    res.status(400).json({ error: 'Provide at least a company name, a LinkedIn company URL, or the offer text.' });
    return;
  }

  try {
    const analysisText = [companyName && `Company: ${companyName}`, offerText].filter(Boolean).join('\n');
    const entities = extractEntities(analysisText);

    // Light-weight scam screen of the offer text (no external verification calls)
    let riskTier: RiskTier | undefined;
    if (offerText) {
      const signals = evaluateScamPatterns(analysisText, entities);
      const org = evaluateOrgConsistency(analysisText, entities);
      if (signals.some((s) => s.severity === 'CRITICAL') || org.overallConsistency === 'SEVERE_MISMATCH') {
        riskTier = 'HIGH RISK';
      }
    }

    const report = await evaluateCompanyCredibility({
      text: analysisText,
      entities,
      riskTier,
      companyName: companyName || undefined,
      linkedinUrl: linkedinUrl || undefined,
      linkedinFacts: body.linkedinFacts
    });

    res.status(200).json(report);
  } catch (error: any) {
    console.error('Company check error:', error);
    res.status(500).json({ error: 'Company check could not be completed. Please try again.' });
  }
}
