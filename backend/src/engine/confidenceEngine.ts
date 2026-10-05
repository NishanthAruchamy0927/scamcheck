import { ExtractedOpportunity, ScamSignal, OrgConsistencyVector, UncertaintyHandling } from './types.js';

export interface ConfidenceResult {
  confidenceScore: number;
  confidenceRationale: string;
  uncertainty: UncertaintyHandling;
}

export function evaluateConfidence(
  text: string,
  entities: ExtractedOpportunity,
  signals: ScamSignal[],
  orgConsistency: OrgConsistencyVector
): ConfidenceResult {
  let score = 50; // baseline
  const missingEvidence: string[] = [];
  const guidanceToAcquire: string[] = [];

  // Factor 1: Submission Length & Depth
  const wordCount = text.trim().split(/\s+/).length;
  const criticalSignals = signals.filter((s) => s.severity === 'CRITICAL');
  const highSignals = signals.filter((s) => s.severity === 'HIGH');
  const positiveSignals = signals.filter((s) => s.severity === 'POSITIVE');

  if (wordCount < 25) {
    if (criticalSignals.length >= 2 || (criticalSignals.length >= 1 && highSignals.length >= 1)) {
      score -= 5;
    } else {
      score -= 20;
      missingEvidence.push('Extremely short submission snippet with limited textual context');
      guidanceToAcquire.push('Provide the full message, email body, or job posting description');
    }
  } else if (wordCount > 80) {
    score += 10;
  }

  // Factor 2: Organization Resolution & Verification
  if (entities.organization === 'Not detected') {
    score -= 15;
    missingEvidence.push('No verifiable hiring organization or institutional entity identified');
    guidanceToAcquire.push('Obtain the legal company or organization name offering the position');
  } else if (orgConsistency.orgIdentityStatus === 'VERIFIED') {
    score += 15;
  } else {
    // Detected but unverified entity
    score -= 10;
    missingEvidence.push('Organization identity is unverified in official registries');
    guidanceToAcquire.push('Request company website or official business registration number');
  }

  // Factor 3: Verifiable Recruiter / Official Domain Presence
  if (entities.recruiterEmail === 'Not detected' && entities.phoneNumber === 'Not detected' && entities.opportunityUrl === 'Not detected') {
    score -= 15;
    missingEvidence.push('No verifiable contact method (official email, phone, or application portal)');
    guidanceToAcquire.push('Request an official corporate email address or official careers link');
  } else if (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL') {
    if (criticalSignals.length === 0) {
      score -= 10;
      missingEvidence.push('Recruiter uses public email provider; corporate domain not established');
      guidanceToAcquire.push('Request recruiter to correspond via verified corporate email domain');
    }
  } else if (orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH') {
    score += 15;
  }

  // Factor 4: Corroborating Signals
  if (criticalSignals.length >= 2 || (criticalSignals.length >= 1 && highSignals.length >= 1)) {
    score += 25; // Multiple severe indicators strongly corroborate threat assessment
  } else if (positiveSignals.length >= 2 && criticalSignals.length === 0) {
    score += 20; // Multiple verified positive anchors
  } else if (signals.length === 0 && wordCount < 50) {
    score -= 10;
  }

  // Bound confidence between 15% and 98%
  const confidenceScore = Math.max(15, Math.min(98, Math.round(score)));

  // Determine Uncertainty State
  const isAmbiguous = (confidenceScore < 60 && criticalSignals.length === 0) || (orgConsistency.overallConsistency === 'PARTIAL_INCONSISTENCY' && criticalSignals.length === 0);

  let confidenceRationale = '';
  let refusalExplanation: string | undefined = undefined;

  if (confidenceScore >= 80) {
    if (criticalSignals.length > 0) {
      confidenceRationale = `High confidence (${confidenceScore}%) because multiple independent high-severity indicators (such as ${criticalSignals.map((s) => s.name).slice(0, 2).join(' and ')}) directly corroborate the assessment.`;
    } else {
      confidenceRationale = `High confidence (${confidenceScore}%) based on verified official corporate channels, clear multi-stage evaluation procedures, and consistent identity anchors.`;
    }
  } else if (confidenceScore >= 60) {
    confidenceRationale = `Moderate confidence (${confidenceScore}%). Core opportunity details are present, though additional external contact verification strengthens the assessment.`;
  } else {
    confidenceRationale = `Limited confidence (${confidenceScore}%). The provided submission is sparse or ambiguous. ScamCheck does not guess when evidence is insufficient.`;
    refusalExplanation = 'Available evidence is insufficient to reach a high-confidence definitive conclusion without further cross-verification.';
  }

  return {
    confidenceScore,
    confidenceRationale,
    uncertainty: {
      isAmbiguous,
      refusalExplanation,
      missingEvidence,
      guidanceToAcquire
    }
  };
}
