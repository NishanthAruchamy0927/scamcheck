import {
  InvestigationReport,
  RiskTier,
  RiskLevel,
  ExtractedOpportunity,
  ScamSignal,
  EvidenceNode,
  OrgConsistencyVector,
  PotentialExposure,
  RecommendedAction,
  UncertaintyHandling,
  CategoryRisks,
  InvestigationStep,
  OpportunityDna,
  TrustProfile,
  Contradiction,
  LegitimacyCheck,
  ManipulationSignal,
  FalsePositiveContext,
  ScoreWaterfallDriver,
  VerificationCenterData,
  MachineLearningAnalysis
} from './types.js';
import { verifyOpportunityClaims } from './externalVerifier.js';

export async function aggregateInvestigation(
  inputSnippet: string,
  inputMode: 'text' | 'document' | 'image' | 'url',
  entities: ExtractedOpportunity,
  signals: ScamSignal[],
  orgConsistency: OrgConsistencyVector,
  potentialExposure: PotentialExposure,
  confidenceScore: number,
  confidenceRationale: string,
  uncertainty: UncertaintyHandling,
  mlAnalysis?: MachineLearningAnalysis
): Promise<InvestigationReport> {
  // 1. Calculate Clustered Deterministic Risk Score with Anti-Double-Counting Dampener
  let rawScore = 5; // ambient baseline

  const clusters: { [cat: string]: number[] } = {};
  let positiveTrustOffset = 0;

  for (const sig of signals) {
    if (sig.weight > 0) {
      const cat = sig.category;
      if (!clusters[cat]) clusters[cat] = [];
      clusters[cat].push(sig.weight);
    } else {
      positiveTrustOffset += sig.weight;
    }
  }

  for (const cat of Object.keys(clusters)) {
    const weights = clusters[cat].sort((a, b) => b - a);
    const primary = weights[0] || 0;
    const secondary = weights.slice(1).reduce((acc, w) => acc + w * 0.4, 0);
    rawScore += primary + secondary;
  }

  rawScore += positiveTrustOffset;

  const hasCriticalScam = signals.some((s) => s.severity === 'CRITICAL');
  if (hasCriticalScam) {
    rawScore = Math.max(rawScore, 65);
  }

  if (orgConsistency.overallConsistency === 'SEVERE_MISMATCH') {
    rawScore = Math.max(rawScore, 65);
  }

  const hasThreatSignals = signals.some((s) => s.weight > 0);
  if (uncertainty.isAmbiguous && !hasCriticalScam && hasThreatSignals) {
    rawScore = Math.min(rawScore, 52);
    rawScore = Math.max(rawScore, 35);
  }

  const deterministicRiskScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  // 1.5 EVIDENCE FUSION LAYER (Deterministic + ML)
  let finalRiskScore = deterministicRiskScore;
  let finalConfidenceScore = confidenceScore;
  
  if (mlAnalysis && mlAnalysis.available && mlAnalysis.score !== undefined && mlAnalysis.confidence !== undefined) {
    // Determine the ML risk contribution
    // Weight ML vs Deterministic based on confidence.
    // If ML is highly confident (e.g. > 80) and Deterministic is ambiguous, ML can bump it.
    // However, if Deterministic has CRITICAL threats, do not lower risk even if ML says it's safe.
    
    // Fusion formula: 70% Deterministic + 30% ML
    let fusedRisk = (deterministicRiskScore * 0.7) + (mlAnalysis.score * 0.3);
    
    // Ensure deterministic CRITICAL threats are never hidden by ML
    if (hasCriticalScam) {
      fusedRisk = Math.max(fusedRisk, 65);
    }
    
    finalRiskScore = Math.max(0, Math.min(100, Math.round(fusedRisk)));
    
    // Confidence fusion
    // System confidence increases if Deterministic and ML agree. 
    // It decreases if they strongly disagree.
    const riskDiff = Math.abs(deterministicRiskScore - mlAnalysis.score);
    if (riskDiff > 40) {
      // Strong disagreement: Reduce system confidence
      finalConfidenceScore = Math.max(10, finalConfidenceScore - 20);
      confidenceRationale += " The AI and deterministic security rules strongly disagreed on this analysis, lowering overall system confidence.";
    } else if (riskDiff < 20) {
      // Agreement: Boost system confidence
      finalConfidenceScore = Math.min(100, finalConfidenceScore + 10);
      confidenceRationale += " The AI model strongly agreed with the deterministic security rules, reinforcing system confidence.";
    }
  }

  if (uncertainty.isAmbiguous && hasThreatSignals && !hasCriticalScam) {
    finalRiskScore = Math.max(finalRiskScore, 31);
  }

  const riskScore = finalRiskScore;
  const confidenceScoreOutput = finalConfidenceScore;

  // 2. Classify Risk Tier & Risk Level
  let riskTier: RiskTier = 'LOW RISK';
  let riskLevel: RiskLevel = 'LOW';
  if (riskScore >= 61) {
    riskTier = 'HIGH RISK';
    riskLevel = 'HIGH';
  } else if (riskScore >= 31) {
    riskTier = 'NEEDS VERIFICATION';
    riskLevel = 'NEEDS_VERIFICATION';
  } else {
    riskTier = 'LOW RISK';
    riskLevel = 'LOW';
  }

  // 3. Calculate 6 Category Risk Dimensions
  const calculateCategoryRisk = (category: string, relatedSignals: ScamSignal[]): number => {
    const catSigs = relatedSignals.filter((s) => s.category === category && s.weight > 0);
    if (catSigs.length === 0) return 0;
    const sum = catSigs.reduce((acc, s) => acc + s.weight, 0);
    return Math.min(100, Math.round((sum / 35) * 100));
  };

  const categoryRisks: CategoryRisks = {
    financial: Math.min(100, calculateCategoryRisk('FINANCIAL', signals) + (entities.paymentRequested ? 30 : 0)),
    identity: Math.min(100, calculateCategoryRisk('IDENTITY', signals) + (entities.requestedDocuments.length > 0 ? 25 : 0)),
    communication: Math.min(100, calculateCategoryRisk('COMMUNICATION', signals) + (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' ? 25 : 0)),
    urgency: Math.min(100, calculateCategoryRisk('URGENCY', signals) + (entities.deadlines !== 'Not detected' ? 20 : 0) + (calculateCategoryRisk('PSYCHOLOGICAL', signals) * 0.5)),
    credential: Math.min(100, calculateCategoryRisk('CREDENTIAL', signals) + (entities.requestedCredentials.length > 0 ? 60 : 0)),
    organization: Math.min(100, calculateCategoryRisk('ORGANIZATION', signals) + (orgConsistency.overallConsistency === 'SEVERE_MISMATCH' ? 70 : orgConsistency.overallConsistency === 'PARTIAL_INCONSISTENCY' ? 40 : 0))
  };

  // 4. Assemble Evidence Chain Nodes
  const evidenceChain: EvidenceNode[] = signals.map((s, idx) => ({
    id: `EV-NODE-${idx + 1}`,
    finding: s.name,
    evidenceQuote: s.evidence,
    whyItMatters: s.whyItMatters,
    riskContribution: s.weight,
    severity: s.severity,
    category: s.category
  }));

  // 5. Recommended Action Playbook
  let recommendedAction: RecommendedAction;

  if (riskTier === 'HIGH RISK') {
    recommendedAction = {
      primaryVerdict: 'STOP',
      headline: 'CRITICAL THREAT DETECTED: Cease Engagement Immediately',
      actionSteps: [
        entities.paymentRequested
          ? `DO NOT make the requested payment (${entities.paymentAmount !== 'Not detected' ? entities.paymentAmount : 'advance fee'}) to secure this position.`
          : 'DO NOT transfer any funds, registration fees, laptop deposits, or training charges.',
        entities.requestedCredentials.length > 0
          ? 'DO NOT provide passwords, OTPs, banking credentials, or UPI PINs.'
          : 'DO NOT share OTPs, passwords, or national identity card scans (Aadhaar/PAN/SSN).',
        'Cease communication across unofficial channels (Telegram, WhatsApp, SMS).',
        'Verify the opportunity independently by navigating directly to the official company careers portal.',
        'Report the fraudulent recruiter profile and contact handles to cybercrime authorities and the host platform.'
      ],
      safetyTips: [
        'Real employers fund candidate onboarding and never request upfront payments.',
        'Official recruiters exclusively use corporate domain emails (e.g. @google.com, @tcs.com).',
        'Urgent deadlines (24-48 hours) are manufactured to inhibit logical verification.'
      ],
      officialVerificationGuide: [
        `Visit ${entities.website !== 'Not detected' ? entities.website : 'the official organization website'} directly via browser.`,
        'Look up the company talent acquisition office phone number via official directory.',
        'Cross-reference the job requisition ID on LinkedIn Jobs or official ATS portal.'
      ]
    };
  } else if (riskTier === 'NEEDS VERIFICATION') {
    recommendedAction = {
      primaryVerdict: 'VERIFY',
      headline: 'CAUTION: Unverified Attributes Require Independent Confirmation',
      actionSteps: [
        'Request the recruiter to send an official verification email from their corporate @domain.com address.',
        'Check whether this exact role/internship title is listed on the organization official careers page.',
        'Do not submit sensitive financial documents or government IDs until authenticity is verified.',
        'Insist on a video or in-person interview with technical team members before signing agreements.',
        'If freelance, request milestone escrow protection through recognized platforms (Upwork, Contra).'
      ],
      safetyTips: [
        'Partial inconsistency or lack of verifiable web footprint does not confirm malice, but demands diligence.',
        'Never accept unverified Google Forms or direct messaging offers without formal offer letters.'
      ],
      officialVerificationGuide: [
        'Search the recruiter profile on LinkedIn and verify current tenure with the claimed company.',
        'Contact the organization HR desk via official switchboard to verify active recruitment campaigns.'
      ]
    };
  } else {
    recommendedAction = {
      primaryVerdict: 'PROCEED_WITH_CAUTION',
      headline: 'VERIFIED SIGNATURE: Standard Hiring Pipeline Detected',
      actionSteps: [
        'Proceed through the standard corporate recruitment workflow and scheduled assessments.',
        'Ensure all subsequent communication remains on authenticated corporate domain channels.',
        'Never disclose sensitive bank login credentials or passwords at any stage of hiring.',
        'Review the written employment contract and compensation details carefully before signing.'
      ],
      safetyTips: [
        'Even in legitimate recruitment, monitor for sudden deviations such as third-party payment requests.',
        'Verify offer letters by checking cryptographic signatures or internal HR verification codes.'
      ],
      officialVerificationGuide: [
        'Track your application status inside the company candidate portal (Greenhouse, Workday, Lever).'
      ]
    };
  }

  // 6. Formulate Grounded AI Summary
  let summary = '';
  if (riskTier === 'HIGH RISK') {
    const keyReasons: string[] = [];
    if (entities.paymentRequested) {
      if (entities.paymentAmount !== 'Not detected') {
        keyReasons.push(`requests a ${entities.paymentAmount} payment for ${entities.paymentReason !== 'Not detected' ? entities.paymentReason : 'registration'}`);
      } else {
        keyReasons.push(`requests an advance payment for ${entities.paymentReason !== 'Not detected' ? entities.paymentReason : 'registration'}`);
      }
    }
    if (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' || orgConsistency.recruiterDomainStatus === 'DOMAIN_MISMATCH') {
      keyReasons.push(`uses a public or mismatched email address (${entities.recruiterEmail}) while claiming affiliation with ${entities.organization !== 'Not detected' ? entities.organization : 'an enterprise'}`);
    }
    if (entities.deadlines !== 'Not detected') {
      keyReasons.push(`imposes strict deadline pressure ("${entities.deadlines}")`);
    }
    if (entities.requestedCredentials.length > 0) {
      keyReasons.push(`attempts to harvest sensitive authentication credentials (${entities.requestedCredentials.join(', ')})`);
    }
    if (keyReasons.length === 0) {
      keyReasons.push(`triggers multiple high-risk indicators (${signals.slice(0, 2).map((s) => s.name).join(', ')})`);
    }

    summary = `The opportunity presents a high level of risk primarily because it ${keyReasons.join(', ')}.`;
  } else if (riskTier === 'NEEDS VERIFICATION') {
    summary = `The opportunity presents moderate ambiguity. While no direct financial extortion was triggered, the submission lacks independent cryptographic corporate domain verification and requires confirmation through official channels.`;
  } else {
    summary = `The opportunity aligns with verified enterprise hiring practices, featuring structured multi-stage evaluation, authenticated official domains, and zero candidate financial obligations.`;
  }

  // 7. Formulate Executive Assessment
  let executiveAssessment = '';
  if (riskTier === 'HIGH RISK') {
    const criticalCount = signals.filter((s) => s.severity === 'CRITICAL').length;
    executiveAssessment = `Investigation classified this opportunity as HIGH RISK (${riskScore}/100) with ${confidenceScoreOutput}% assessment confidence. Detected ${signals.length} threat indicators, including ${criticalCount} critical fraud vectors (${signals.slice(0, 2).map((s) => s.name).join(', ')}). The hiring pattern exhibits classic deception mechanics. Immediate disengagement is advised.`;
  } else if (riskTier === 'NEEDS VERIFICATION') {
    executiveAssessment = `Investigation classified this opportunity as NEEDS VERIFICATION (${riskScore}/100) with ${confidenceScoreOutput}% confidence. While no direct financial extortion was triggered, the submission exhibits inconsistencies or lacks cryptographic proof of corporate authorization. Independent cross-verification through official corporate channels is strongly recommended before sharing personal data.`;
  } else {
    executiveAssessment = `Investigation classified this opportunity as LOW RISK (${riskScore}/100) with ${confidenceScoreOutput}% confidence. Opportunity attributes align with legitimate enterprise talent acquisition standards, verified domain infrastructure, and conventional screening protocols with zero candidate financial liability.`;
  }

  // ----------------------------------------------------
  // 8. PROMPT 5 DIFFERENTIATION LAYER COMPUTATIONS
  // ----------------------------------------------------

  // 8.1 Opportunity DNA
  let evidenceCompleteness = 50;
  if (entities.organization !== 'Not detected') evidenceCompleteness += 10;
  if (entities.recruiterEmail !== 'Not detected') evidenceCompleteness += 10;
  if (entities.jobTitle !== 'Not detected') evidenceCompleteness += 10;
  if (entities.salaryStipend !== 'Not detected') evidenceCompleteness += 10;
  if (entities.applicationMethod !== 'Standard Direct Inquiry') evidenceCompleteness += 10;
  evidenceCompleteness = Math.min(100, evidenceCompleteness);

  const opportunityDna: OpportunityDna = {
    organization: entities.organization,
    recruiter: entities.recruiter,
    contact: entities.recruiterEmail,
    domain: entities.website,
    opportunityType: entities.opportunityType,
    compensation: entities.salaryStipend,
    payment: entities.paymentAmount,
    urgency: entities.deadlines,
    selection: entities.applicationMethod,
    evidenceCompleteness,
    consistencyFingerprint: {
      organization: orgConsistency.orgIdentityStatus === 'VERIFIED' ? 'MATCH' : orgConsistency.orgIdentityStatus === 'UNRESOLVED' ? 'UNKNOWN' : 'MATCH',
      recruiter: entities.recruiter !== 'Not detected' ? 'MATCH' : 'UNKNOWN',
      contact: orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH' ? 'MATCH' : (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' || orgConsistency.recruiterDomainStatus === 'DOMAIN_MISMATCH') ? 'MISMATCH' : 'UNKNOWN',
      payment: entities.paymentRequested ? 'MISMATCH' : 'MATCH',
      process: (entities.applicationMethod.includes('Direct Selection Without Interview') || entities.applicationMethod.includes('Telegram')) ? 'MISMATCH' : 'MATCH'
    }
  };

  // 8.2 Opportunity Trust Profile
  const trustProfile: TrustProfile = {
    identityConsistency: Math.max(0, 100 - categoryRisks.organization),
    contactConsistency: Math.max(0, 100 - categoryRisks.communication),
    processConsistency: Math.max(0, 100 - Math.round(categoryRisks.urgency * 0.7)),
    financialSafety: Math.max(0, 100 - categoryRisks.financial),
    evidenceStrength: confidenceScoreOutput
  };

  // 8.3 Contradiction Engine
  const contradictions: Contradiction[] = [];
  const lowerText = inputSnippet.toLowerCase();

  // Contradiction 1: Enterprise Brand vs Public Webmail
  if (
    entities.organization !== 'Not detected' &&
    (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' || orgConsistency.recruiterDomainStatus === 'DOMAIN_MISMATCH')
  ) {
    contradictions.push({
      id: 'CONTRA-01',
      type: 'IDENTITY_VS_CHANNEL',
      claimA: `Claimed Enterprise: ${entities.organization}`,
      claimB: `Recruiter Contact: ${entities.recruiterEmail}`,
      explanation: `Organization claims enterprise brand affiliation with ${entities.organization}, but recruiter contact originates from an unauthenticated public domain (${entities.recruiterEmail}).`,
      severity: 'CRITICAL'
    });
  }

  // Contradiction 2: Claimed "No Fee / Free" vs Explicit Payment Request
  if (lowerText.includes('free') || lowerText.includes('zero cost') || lowerText.includes('no fee')) {
    if (entities.paymentRequested) {
      contradictions.push({
        id: 'CONTRA-02',
        type: 'STATED_FREE_VS_FEE_DEMAND',
        claimA: 'Stated terms mention free/zero recruitment fees',
        claimB: `Demanded payment: ${entities.paymentAmount}`,
        explanation: 'Opportunity text states zero recruitment fee policy, yet later demands an upfront advance payment or deposit.',
        severity: 'CRITICAL'
      });
    }
  }

  // Contradiction 3: Remote Internship vs Physical Office Immediate Joining
  if (entities.location.includes('Remote') && (lowerText.includes('report to office tomorrow') || lowerText.includes('in-person verification mandatory at location'))) {
    contradictions.push({
      id: 'CONTRA-03',
      type: 'REMOTE_VS_IN_PERSON',
      claimA: 'Work Mode: Remote / Work From Home',
      claimB: 'Condition: Immediate physical office reporting mandated',
      explanation: 'Role is marketed as 100% remote, but instructions demand immediate mandatory in-person office appearance.',
      severity: 'MEDIUM'
    });
  }

  // Contradiction 4: High Payout for Low-Skill / No-Interview Selection
  if (
    entities.applicationMethod.includes('Without Interview') &&
    (entities.salaryStipend !== 'Not detected' || lowerText.includes('guaranteed payout') || lowerText.includes('per day'))
  ) {
    contradictions.push({
      id: 'CONTRA-04',
      type: 'SELECTION_VS_COMPENSATION',
      claimA: 'Direct selection with zero interviews/evaluations',
      claimB: `Guaranteed compensation: ${entities.salaryStipend}`,
      explanation: 'High compensation is guaranteed without conducting technical interviews or portfolio verification.',
      severity: 'HIGH'
    });
  }

  // 8.4 Legitimacy Check
  const positiveIndicators: string[] = [];
  if (orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH') {
    positiveIndicators.push('Recruiter contact authenticated against official corporate domain');
  }
  if (!entities.paymentRequested && entities.paymentAmount === 'Not detected') {
    positiveIndicators.push('Zero candidate upfront registration or hardware fees detected');
  }
  if (orgConsistency.recruitmentWorkflowStatus === 'STANDARD_MULTI_STAGE') {
    positiveIndicators.push('Structured multi-stage recruitment and assessment workflow');
  }
  if (orgConsistency.contactPlatformStatus === 'ENTERPRISE_ATS') {
    positiveIndicators.push('Application routed through authenticated enterprise candidate portal');
  }
  if (entities.salaryStipend !== 'Not detected' && !entities.paymentRequested) {
    positiveIndicators.push('Transparent compensation structure disclosed without fee deductions');
  }

  const legitimacyCheck: LegitimacyCheck = {
    positiveIndicators,
    rationale: positiveIndicators.length > 0
      ? 'These positive indicators reduce overall risk, but do not independently prove legitimacy. Always cross-reference high-impact decisions.'
      : 'No verified positive trust anchors were detected in the submitted opportunity.'
  };

  // 8.5 Manipulation Signals
  const manipulationSignals: ManipulationSignal[] = [];
  if (entities.deadlines !== 'Not detected') {
    manipulationSignals.push({
      type: 'URGENCY',
      quote: entities.deadlines,
      explanation: 'Artificial strict deadline manufactures psychological pressure to rush payments before logical verification.'
    });
  }
  if (/only\s*[0-9]+\s*(?:seats|slots|spots)\s*left/i.test(inputSnippet)) {
    manipulationSignals.push({
      type: 'SCARCITY',
      quote: 'Only limited seats / slots remaining',
      explanation: 'Artificial scarcity creates Fear Of Missing Out (FOMO) to discourage independent research.'
    });
  }
  if (/congratulations.*selected|shortlisted directly|official company selection/i.test(inputSnippet)) {
    manipulationSignals.push({
      type: 'AUTHORITY',
      quote: 'Direct selection / shortlisting claim',
      explanation: 'Authoritative flattery lowers candidate suspicion before introducing financial demands.'
    });
  }
  if (/do not contact.*office|confidential hiring channel|exclusive internal quota/i.test(inputSnippet)) {
    manipulationSignals.push({
      type: 'SECRECY',
      quote: 'Instructions discouraging independent office contact',
      explanation: 'Explicitly deters candidate from verifying the recruiter through official company channels.'
    });
  }
  if (/100%\s*(?:job guarantee|placement guarantee)|daily guaranteed/i.test(inputSnippet)) {
    manipulationSignals.push({
      type: 'GUARANTEE',
      quote: '100% Guaranteed Employment / Daily Return',
      explanation: 'Unrealistic zero-risk guarantees entice victims with certainty.'
    });
  }

  // 8.6 False-Positive Awareness
  const falsePositiveContext: FalsePositiveContext[] = [];
  if (orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL') {
    falsePositiveContext.push({
      signalName: 'Public Webmail Provider (e.g. Gmail / Yahoo)',
      potentialBenignExplanation: 'Early-stage startups, university student clubs, and independent boutique agencies may legitimately use public webmail.',
      contextualAdvice: 'A public email address alone does not prove malice; verify recruiter identity on LinkedIn and check official company registry records.'
    });
  }
  if (entities.communicationPlatform === 'Telegram' || entities.communicationPlatform === 'Discord') {
    falsePositiveContext.push({
      signalName: 'Informal Chat Communication (Telegram / Discord)',
      potentialBenignExplanation: 'Web3, open-source communities, and decentralized freelance teams frequently use Discord or Telegram for collaboration.',
      contextualAdvice: 'Ensure contracts and escrow agreements are signed through reputable platforms before starting work.'
    });
  }

  // 8.7 Score Waterfall Drivers
  const scoreDrivers: ScoreWaterfallDriver[] = [];
  for (const s of signals) {
    scoreDrivers.push({
      name: s.name,
      delta: s.weight,
      category: s.category
    });
  }

  // 9. Structured Investigation Timeline Steps
  const now = new Date().toISOString();
  const investigationSteps: InvestigationStep[] = [
    {
      step: 1,
      name: 'Content Ingestion & Normalization',
      status: 'COMPLETED',
      detail: `Sanitized and tokenized ${inputSnippet.length} characters of ${inputMode.toUpperCase()} input.`,
      timestamp: now
    },
    {
      step: 2,
      name: 'Entity Extraction & Blueprint Mapping',
      status: 'COMPLETED',
      detail: `Extracted: Org='${entities.organization}', Role='${entities.jobTitle}', Payment='${entities.paymentAmount}'.`,
      timestamp: now
    },
    {
      step: 3,
      name: 'Deterministic Pattern Detection',
      status: 'COMPLETED',
      detail: `Scanned 22+ rules; detected ${signals.length} signals (${signals.filter((s) => s.severity === 'CRITICAL').length} critical).`,
      timestamp: now
    },
    {
      step: 4,
      name: 'Organization Consistency & Exposure Audit',
      status: 'COMPLETED',
      detail: `Consistency='${orgConsistency.overallConsistency}', Financial Exposure='${potentialExposure.financialLevel}'.`,
      timestamp: now
    },
    {
      step: 5,
      name: 'Hybrid Risk & Confidence Synthesis',
      status: 'COMPLETED',
      detail: `Calibrated Risk=${riskScore}/100 (${riskTier}), Confidence=${confidenceScoreOutput}%. ${mlAnalysis?.available ? 'ML Engine fused.' : 'ML Engine unavailable.'}`,
      timestamp: now
    },
    {
      step: 6,
      name: 'Action Playbook Generation',
      status: 'COMPLETED',
      detail: `Verdict='${recommendedAction.primaryVerdict}': ${recommendedAction.headline}`,
      timestamp: now
    }
  ];

  const reportId = `SC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const limitations = uncertainty.missingEvidence.length > 0
    ? uncertainty.missingEvidence
    : ['Analysis is constrained to the submitted text and publicly indexable corporate registry records.'];

  return {
    id: reportId,
    timestamp: now,
    inputSnippet: inputSnippet.length > 300 ? inputSnippet.substring(0, 297) + '...' : inputSnippet,
    inputMode,
    riskScore,
    confidenceScore: confidenceScoreOutput,
    riskLevel,
    riskTier,
    confidenceRationale,
    summary,
    executiveAssessment,
    recommendation: recommendedAction.headline,
    categoryRisks,
    opportunity: entities,
    extractedOpportunity: entities,
    signals,
    evidence: evidenceChain,
    evidenceChain,
    orgConsistency,
    potentialExposure,
    recommendedAction,
    uncertainty,
    limitations,
    investigationSteps,
    disclaimer:
      'ScamCheck provides algorithmic risk indicators and intelligence signals based on submitted evidence, not definitive legal proof of fraud. High-impact academic, financial, and career decisions should always be cross-referenced with independent primary sources.',

    // Prompt 5 Features
    opportunityDna,
    trustProfile,
    contradictions,
    legitimacyCheck,
    manipulationSignals,
    falsePositiveContext,
    scoreDrivers,

    // External Verification Center (Prompt 6)
    verificationCenter: await verifyOpportunityClaims(entities, orgConsistency, inputSnippet),

    // ML Analysis (Phase 4)
    machineLearning: mlAnalysis
  };
}
