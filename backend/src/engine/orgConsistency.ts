import { ExtractedOpportunity, OrgConsistencyVector } from './types.js';
import { KNOWN_ENTERPRISES, FREE_PUBLIC_EMAIL_DOMAINS, VERIFIED_ENTERPRISE_ATS_DOMAINS } from './knownDatabases.js';

export function evaluateOrgConsistency(
  rawText: string,
  entities: ExtractedOpportunity
): OrgConsistencyVector {
  const text = rawText || '';
  const lower = text.toLowerCase();

  // 1. Evaluate Organization Identity
  let orgIdentityStatus: OrgConsistencyVector['orgIdentityStatus'] = 'UNRESOLVED';
  let orgIdentityNotes = 'No distinct corporate or institutional organization could be resolved from the submission.';

  const matchedEnt = KNOWN_ENTERPRISES.find(
    (e) => e.name.toLowerCase() === entities.organization.toLowerCase()
  );

  if (matchedEnt) {
    orgIdentityStatus = 'VERIFIED';
    orgIdentityNotes = `Recognized enterprise entity "${matchedEnt.name}". Standard hiring policies and official domains catalogued.`;
  } else if (entities.organization !== 'Not detected') {
    orgIdentityStatus = 'DETECTED';
    orgIdentityNotes = `Organization name "${entities.organization}" detected from submission text, but not in pre-verified Fortune/Enterprise database.`;
  } else {
    orgIdentityStatus = 'AMBIGUOUS';
    orgIdentityNotes = 'No explicit company or institutional name identified in the opportunity submission.';
  }

  // 2. Evaluate Official Domain
  let officialDomainStatus: OrgConsistencyVector['officialDomainStatus'] = 'MISSING';
  let officialDomainNotes = 'No official corporate domain was identified or provided in the text.';

  if (matchedEnt) {
    officialDomainStatus = 'MATCHED';
    officialDomainNotes = `Official corporate domain for ${matchedEnt.name} is "${matchedEnt.officialDomains.join(', ')}".`;
  } else if (entities.website !== 'Not detected') {
    officialDomainStatus = 'DETECTED';
    officialDomainNotes = `Domain "${entities.website}" extracted from submission links.`;
  }

  // 3. Evaluate Recruiter Domain & Email Authenticity
  let recruiterDomainStatus: OrgConsistencyVector['recruiterDomainStatus'] = 'UNSPECIFIED';
  let recruiterDomainNotes = 'No recruiter email address was detected in the submitted opportunity.';

  let emailDomain = '';
  if (entities.recruiterEmail !== 'Not detected') {
    const parts = entities.recruiterEmail.split('@');
    if (parts.length === 2) {
      emailDomain = parts[1].toLowerCase();
    }
  }

  if (emailDomain) {
    if (FREE_PUBLIC_EMAIL_DOMAINS.has(emailDomain)) {
      if (matchedEnt) {
        recruiterDomainStatus = 'DOMAIN_MISMATCH';
        recruiterDomainNotes = `Severe Inconsistency: Recruiter uses free public webmail (@${emailDomain}) while claiming to hire on behalf of ${matchedEnt.name}.`;
      } else {
        recruiterDomainStatus = 'PUBLIC_FREE_EMAIL';
        recruiterDomainNotes = `Recruiter uses public email provider (@${emailDomain}) rather than a custom corporate domain.`;
      }
    } else if (matchedEnt) {
      const isMatch = matchedEnt.officialDomains.some(
        (d) => emailDomain === d || emailDomain.endsWith(`.${d}`)
      );
      if (isMatch) {
        recruiterDomainStatus = 'OFFICIAL_MATCH';
        recruiterDomainNotes = `Recruiter domain @${emailDomain} matches official verified corporate domain for ${matchedEnt.name}.`;
      } else {
        recruiterDomainStatus = 'DOMAIN_MISMATCH';
        recruiterDomainNotes = `Recruiter domain @${emailDomain} does not match official domain (${matchedEnt.officialDomains.join(', ')}) for ${matchedEnt.name}.`;
      }
    } else {
      recruiterDomainStatus = 'OFFICIAL_MATCH';
      recruiterDomainNotes = `Recruiter uses custom domain @${emailDomain}.`;
    }
  } else if (entities.communicationPlatform === 'Telegram' || entities.communicationPlatform === 'WhatsApp') {
    recruiterDomainStatus = 'ANONYMOUS_CHANNEL';
    recruiterDomainNotes = `Contact details rely exclusively on anonymous chat channels (${entities.communicationPlatform}) without corporate email.`;
  }

  // 4. Evaluate Contact Platform & Ingestion Channels
  let contactPlatformStatus: OrgConsistencyVector['contactPlatformStatus'] = 'UNSPECIFIED';
  let contactPlatformNotes = 'Communication channels are unverified or standard plain text.';

  if (entities.opportunityUrl !== 'Not detected') {
    try {
      const host = new URL(entities.opportunityUrl).hostname.toLowerCase();
      if (VERIFIED_ENTERPRISE_ATS_DOMAINS.some((ats) => host === ats || host.endsWith(`.${ats}`))) {
        contactPlatformStatus = 'ENTERPRISE_ATS';
        contactPlatformNotes = `Application processed via verified enterprise recruiting portal (${host}).`;
      } else if (host.includes('forms.gle') || host.includes('docs.google.com/forms')) {
        contactPlatformStatus = 'UNOFFICIAL_CHAT_APP';
        contactPlatformNotes = 'Application hosted on generic unauthenticated Google Form.';
      }
    } catch {
      // ignore
    }
  }

  if (contactPlatformStatus === 'UNSPECIFIED') {
    if (entities.communicationPlatform === 'Telegram' || entities.communicationPlatform === 'WhatsApp') {
      contactPlatformStatus = 'UNOFFICIAL_CHAT_APP';
      contactPlatformNotes = `Direct candidate onboarding routed via ${entities.communicationPlatform} messaging.`;
    } else if (recruiterDomainStatus === 'OFFICIAL_MATCH') {
      contactPlatformStatus = 'OFFICIAL_EMAIL';
      contactPlatformNotes = 'Correspondence conducted via corporate authenticated email.';
    } else if (entities.phoneNumber !== 'Not detected') {
      contactPlatformStatus = 'DIRECT_PHONE';
      contactPlatformNotes = `Direct telephone contact detected: ${entities.phoneNumber}`;
    }
  }

  // 5. Evaluate Recruitment Workflow & Selection Process
  let recruitmentWorkflowStatus: OrgConsistencyVector['recruitmentWorkflowStatus'] = 'UNSPECIFIED';
  let recruitmentWorkflowNotes = 'Recruitment process specifics could not be comprehensively evaluated from submission.';

  if (entities.paymentAmount !== 'Not detected') {
    recruitmentWorkflowStatus = 'PAYMENT_GATED';
    recruitmentWorkflowNotes = `Unusual process: Candidate onboarding or offer confirmation requires upfront fee payment (${entities.paymentAmount}).`;
  } else if (/selected without interview|direct selection|no interview required|profile shortlisted directly/i.test(text)) {
    recruitmentWorkflowStatus = 'NO_INTERVIEW_INSTANT_OFFER';
    recruitmentWorkflowNotes = 'Irregular process: Candidate offered role or internship without technical screening or interview assessment.';
  } else if (/round\s*1|technical\s*assessment|coding\s*round|panel\s*interview|hiring\s*manager\s*round/i.test(text)) {
    recruitmentWorkflowStatus = 'STANDARD_MULTI_STAGE';
    recruitmentWorkflowNotes = 'Standard process: Multi-round technical assessment and behavioral evaluation outlined.';
  } else {
    recruitmentWorkflowStatus = 'INFORMAL_DIRECT';
    recruitmentWorkflowNotes = 'Direct informal outreach; screening criteria not fully detailed.';
  }

  // Synthesis of Overall Consistency
  let overallConsistency: OrgConsistencyVector['overallConsistency'] = 'INSUFFICIENT_DATA';
  if (
    recruiterDomainStatus === 'DOMAIN_MISMATCH' ||
    recruitmentWorkflowStatus === 'PAYMENT_GATED' ||
    (matchedEnt && recruiterDomainStatus === 'PUBLIC_FREE_EMAIL')
  ) {
    overallConsistency = 'SEVERE_MISMATCH';
  } else if (
    recruiterDomainStatus === 'PUBLIC_FREE_EMAIL' ||
    contactPlatformStatus === 'UNOFFICIAL_CHAT_APP' ||
    recruitmentWorkflowStatus === 'NO_INTERVIEW_INSTANT_OFFER'
  ) {
    overallConsistency = 'PARTIAL_INCONSISTENCY';
  } else if (
    (orgIdentityStatus === 'VERIFIED' && recruiterDomainStatus === 'OFFICIAL_MATCH') ||
    (contactPlatformStatus === 'ENTERPRISE_ATS' && recruitmentWorkflowStatus === 'STANDARD_MULTI_STAGE')
  ) {
    overallConsistency = 'STRONG_ALIGNMENT';
  } else {
    overallConsistency = 'INSUFFICIENT_DATA';
  }

  return {
    orgIdentityStatus,
    orgIdentityNotes,
    officialDomainStatus,
    officialDomainNotes,
    recruiterDomainStatus,
    recruiterDomainNotes,
    contactPlatformStatus,
    contactPlatformNotes,
    recruitmentWorkflowStatus,
    recruitmentWorkflowNotes,
    overallConsistency
  };
}
