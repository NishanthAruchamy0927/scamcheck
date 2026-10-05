import { Request, Response } from 'express';
import { extractEntities } from '../engine/entityExtractor.js';
import { evaluateScamPatterns } from '../engine/patternEngine.js';
import { evaluateOrgConsistency } from '../engine/orgConsistency.js';
import { calculatePotentialExposure } from '../engine/exposureCalculator.js';
import { evaluateConfidence } from '../engine/confidenceEngine.js';
import { aggregateInvestigation } from '../engine/riskAggregator.js';
import { ComparisonReport, InvestigationReport } from '../engine/types.js';

async function processSingleText(text: string, label: string): Promise<InvestigationReport> {
  const entities = extractEntities(text);
  const signals = evaluateScamPatterns(text, entities);
  const orgConsistency = evaluateOrgConsistency(text, entities);
  const potentialExposure = calculatePotentialExposure(entities, signals);
  const confidence = evaluateConfidence(text, entities, signals, orgConsistency);

  return await aggregateInvestigation(
    text,
    'text',
    entities,
    signals,
    orgConsistency,
    potentialExposure,
    confidence.confidenceScore,
    confidence.confidenceRationale,
    confidence.uncertainty
  );
}

export async function handleCompare(req: Request, res: Response): Promise<void> {
  try {
    const { textA, textB } = req.body;

    if (!textA || !textB || typeof textA !== 'string' || typeof textB !== 'string') {
      res.status(400).json({
        error: 'Comparison requires two opportunity text payloads: "textA" and "textB".'
      });
      return;
    }

    const reportA = await processSingleText(textA, 'Opportunity A');
    const reportB = await processSingleText(textB, 'Opportunity B');

    const riskDelta = Math.abs(reportA.riskScore - reportB.riskScore);
    let saferOption: 'A' | 'B' | 'EQUAL' = 'EQUAL';
    if (reportA.riskScore < reportB.riskScore) {
      saferOption = 'A';
    } else if (reportB.riskScore < reportA.riskScore) {
      saferOption = 'B';
    }

    const keyDifferences: string[] = [];

    // Financial difference
    if (reportA.extractedOpportunity.paymentAmount !== 'Not detected' && reportB.extractedOpportunity.paymentAmount === 'Not detected') {
      keyDifferences.push(`Opportunity A requires an upfront fee payment (${reportA.extractedOpportunity.paymentAmount}), whereas Opportunity B requires zero financial outlay.`);
    } else if (reportB.extractedOpportunity.paymentAmount !== 'Not detected' && reportA.extractedOpportunity.paymentAmount === 'Not detected') {
      keyDifferences.push(`Opportunity B requires an upfront fee payment (${reportB.extractedOpportunity.paymentAmount}), whereas Opportunity A requires zero financial outlay.`);
    }

    // Domain & Recruiter difference
    if (reportA.orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH' && reportB.orgConsistency.recruiterDomainStatus !== 'OFFICIAL_MATCH') {
      keyDifferences.push(`Opportunity A has authenticated recruiter domain alignment, while Opportunity B uses unverified or public communication channels.`);
    } else if (reportB.orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH' && reportA.orgConsistency.recruiterDomainStatus !== 'OFFICIAL_MATCH') {
      keyDifferences.push(`Opportunity B has authenticated recruiter domain alignment, while Opportunity A uses unverified or public communication channels.`);
    }

    // Interview Workflow difference
    if (reportA.orgConsistency.recruitmentWorkflowStatus === 'STANDARD_MULTI_STAGE' && reportB.orgConsistency.recruitmentWorkflowStatus !== 'STANDARD_MULTI_STAGE') {
      keyDifferences.push('Opportunity A details standard multi-stage technical screening, whereas Opportunity B employs instant or unverified selection.');
    } else if (reportB.orgConsistency.recruitmentWorkflowStatus === 'STANDARD_MULTI_STAGE' && reportA.orgConsistency.recruitmentWorkflowStatus !== 'STANDARD_MULTI_STAGE') {
      keyDifferences.push('Opportunity B details standard multi-stage technical screening, whereas Opportunity A employs instant or unverified selection.');
    }

    // Credential Harvesting difference
    if (reportA.extractedOpportunity.requestedCredentials.length > 0 && reportB.extractedOpportunity.requestedCredentials.length === 0) {
      keyDifferences.push('Opportunity A demands sensitive authentication credentials/passwords, presenting critical account takeover risk.');
    } else if (reportB.extractedOpportunity.requestedCredentials.length > 0 && reportA.extractedOpportunity.requestedCredentials.length === 0) {
      keyDifferences.push('Opportunity B demands sensitive authentication credentials/passwords, presenting critical account takeover risk.');
    }

    if (keyDifferences.length === 0) {
      keyDifferences.push(`Risk differential is ${riskDelta} points. Both opportunities share comparable operational and verification profiles.`);
    }

    let recommendation = '';
    if (saferOption === 'A') {
      recommendation = `Opportunity A is substantially safer (Risk Score: ${reportA.riskScore}/100 vs ${reportB.riskScore}/100). Opportunity B presents critical threat indicators.`;
    } else if (saferOption === 'B') {
      recommendation = `Opportunity B is substantially safer (Risk Score: ${reportB.riskScore}/100 vs ${reportA.riskScore}/100). Opportunity A presents critical threat indicators.`;
    } else {
      recommendation = `Both opportunities carry identical risk tiers (${reportA.riskTier}). Exercise standard procedural diligence.`;
    }

    const comparisonReport: ComparisonReport = {
      id: `COMP-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      itemA: reportA,
      itemB: reportB,
      deltaSummary: {
        riskDelta,
        saferOption,
        keyDifferences,
        recommendation
      }
    };

    res.status(200).json(comparisonReport);
  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({
      error: 'Comparison Engine Error',
      details: error.message
    });
  }
}
