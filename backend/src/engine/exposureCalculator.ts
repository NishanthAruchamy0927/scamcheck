import { ExtractedOpportunity, PotentialExposure, ExposureLevel, ScamSignal } from './types.js';

export function calculatePotentialExposure(
  entities: ExtractedOpportunity,
  signals: ScamSignal[]
): PotentialExposure {
  // 1. Financial Exposure Calculation
  let financialLevel: ExposureLevel = 'NONE';
  let financialNotes = 'No upfront financial demands or payment requests detected in the opportunity text.';
  let financialAmount = entities.paymentAmount !== 'Not detected' ? entities.paymentAmount : '₹0 / $0';

  if (entities.paymentAmount !== 'Not detected') {
    financialLevel = 'CRITICAL';
    financialNotes = `Potential direct loss of ${entities.paymentAmount} requested for "${entities.paymentPurpose}". Risk of secondary demands once initial payment is sent.`;
  } else if (signals.some((s) => s.category === 'FINANCIAL' && s.severity === 'CRITICAL')) {
    financialLevel = 'CRITICAL';
    financialNotes = 'Critical financial advance-fee or hardware deposit vectors detected.';
  } else if (signals.some((s) => s.category === 'FINANCIAL')) {
    financialLevel = 'MEDIUM';
    financialNotes = 'Potential secondary financial exposure through commission or task-based fees.';
  }

  // 2. Credential Exposure Calculation
  let credentialLevel: ExposureLevel = 'NONE';
  let credentialNotes = 'No demands for account passwords, OTPs, or authentication credentials detected.';

  if (entities.requestedCredentials.length > 0) {
    credentialLevel = 'CRITICAL';
    credentialNotes = `Immediate threat of account takeover. Demands sensitive secrets: ${entities.requestedCredentials.join(', ')}.`;
  }

  // 3. Identity Document Exposure Calculation
  let identityLevel: ExposureLevel = 'NONE';
  let identityNotes = 'No premature government identity documents or sensitive scans requested.';

  if (entities.requestedDocuments.length > 0) {
    const highRiskDocs = entities.requestedDocuments.filter((d) =>
      ['Aadhaar Card', 'PAN Card', 'Social Security Number (SSN)', 'Debit / Credit Card Scan', 'Bank Statement / Cheque', 'Passport Copy'].includes(d)
    );
    if (highRiskDocs.length > 0) {
      identityLevel = 'HIGH';
      identityNotes = `High identity theft and unauthorized financial KYC exposure through requested documents: ${highRiskDocs.join(', ')}.`;
    } else {
      identityLevel = 'MEDIUM';
      identityNotes = `Standard identity documents requested: ${entities.requestedDocuments.join(', ')}. Ensure transmission only via authenticated portals.`;
    }
  }

  // 4. Employment / Time Loss Exposure Calculation
  let employmentLevel: ExposureLevel = 'LOW';
  let employmentNotes = 'Standard job exploration time investment.';

  if (signals.some((s) => s.signalId === 'SIG-TSK-16' || s.signalId === 'SIG-PAY-07')) {
    employmentLevel = 'HIGH';
    employmentNotes = 'High risk of uncompensated labor and fraudulent task exploitation (fake reviews/ratings).';
  } else if (signals.some((s) => s.signalId === 'SIG-SEL-08' || s.signalId === 'SIG-CLM-14')) {
    employmentLevel = 'MEDIUM';
    employmentNotes = 'Potential time loss pursuing non-existent placement or phantom position.';
  }

  // 5. Privacy Exposure Calculation
  let privacyLevel: ExposureLevel = 'LOW';
  let privacyNotes = 'Standard communication contact privacy baseline.';

  if (entities.communicationPlatform === 'Telegram' || entities.communicationPlatform === 'WhatsApp') {
    privacyLevel = 'HIGH';
    privacyNotes = 'Personal phone number and profile exposed to unverified chat syndicates, increasing risk of future phishing campaigns.';
  } else if (entities.opportunityUrl.includes('forms.gle')) {
    privacyLevel = 'MEDIUM';
    privacyNotes = 'Personal resume details collected via unauthenticated public Google Form.';
  }

  return {
    financial: financialLevel,
    financialAmount,
    financialLevel,
    financialNotes,
    credential: credentialLevel,
    credentialLevel,
    credentialNotes,
    identity: identityLevel,
    identityLevel,
    identityNotes,
    employment: employmentLevel,
    employmentLevel,
    employmentNotes,
    privacy: privacyLevel,
    privacyLevel,
    privacyNotes
  };
}
