import { ExtractedOpportunity, ScamSignal } from './types.js';
import {
  KNOWN_ENTERPRISES,
  FREE_PUBLIC_EMAIL_DOMAINS,
  VERIFIED_ENTERPRISE_ATS_DOMAINS,
  SUSPICIOUS_SHORTENERS
} from './knownDatabases.js';

export function evaluateScamPatterns(
  text: string,
  entities: ExtractedOpportunity
): ScamSignal[] {
  const signals: ScamSignal[] = [];
  const lower = text.toLowerCase();

  // Helper to extract surrounding context for evidence quote
  const findQuote = (regex: RegExp, fallback: string): string => {
    const match = text.match(regex);
    if (match) {
      const idx = text.indexOf(match[0]);
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + match[0].length + 40);
      return `"...${text.substring(start, end).replace(/\s+/g, ' ').trim()}..."`;
    }
    return fallback;
  };

  // Helper to check if a phrase is part of an anti-fraud / negation statement (e.g. "Google NEVER requests fees")
  const isNegated = (keyword: string): boolean => {
    const negationRegex = new RegExp(
      `(?:never|no|not|neither|zero|without)\\s+(?:ask|request|require|demand|charge|pay|collect)?(?:\\s+[\\w]+){0,4}\\s+${keyword}`,
      'i'
    );
    return negationRegex.test(text);
  };

  // 1. Advance Payment / Registration Fee
  const advancePaymentRegex = /(?:registration\s*fee|application\s*fee|processing\s*fee|security\s*deposit|refundable\s*deposit|onboarding\s*fee|training\s*fee|pay\s*(?:INR|Rs\.?|₹|\$|USD|EUR|€|£)\s*[\d,]+|send\s*(?:INR|Rs\.?|₹|\$|USD|EUR|€|£)\s*[\d,]+|clearance\s*fee|advance\s*payment|payment\s*before\s*onboarding)/i;
  const rawFeeMatch = text.match(advancePaymentRegex);
  
  if (
    (rawFeeMatch && !isNegated('security\\s*deposit') && !isNegated('application\\s*fees?') && !isNegated('training\\s*charges?')) ||
    (entities.paymentAmount !== 'Not detected' && !isNegated('fee') && !isNegated('money'))
  ) {
    const isZeroFeeStatement = /never\s*requests?\s*(?:application\s*)?fees|zero\s*recruitment\s*fee/i.test(text);
    if (!isZeroFeeStatement) {
      signals.push({
        id: 'SIG-ADV-01',
        signalId: 'SIG-ADV-01',
        name: 'Upfront Financial Requirement / Registration Fee',
        severity: 'CRITICAL',
        category: 'FINANCIAL',
        evidence: findQuote(advancePaymentRegex, `Financial request detected: ${entities.paymentAmount} (${entities.paymentPurpose})`),
        weight: 30,
        riskContribution: 30,
        explanation: 'Payment is requested before the opportunity is confirmed or started.',
        whyItMatters: 'Legitimate employers, reputable scholarship foundations, and authentic internship programs NEVER charge candidates upfront registration, onboarding, or training fees.',
        mitigation: 'Do NOT transfer money via UPI, NetBanking, Crypto, or gift cards under any circumstances.'
      });
    }
  }

  // 2. Mandatory Paid Training / Certification Purchase
  const trainingFeeRegex = /(?:mandatory\s*training\s*charge|certificate\s*purchase|training\s*cost\s*(?:of|is)\s*(?:INR|Rs|₹|\$|USD|EUR|€)|course\s*fee\s*(?:of|is)\s*(?:INR|Rs|₹|\$|USD|EUR|€)|pay\s*for\s*training)/i;
  const isSponsoredTraining = /(?:100%\s*sponsored|fully\s*paid\s*(?:\d+[\s-]month\s*)?corporate\s*training|sponsored\s*by|employer\s*sponsored)/i.test(text);

  if (trainingFeeRegex.test(text) && !isNegated('training') && !isSponsoredTraining) {
    signals.push({
      id: 'SIG-TRN-02',
      signalId: 'SIG-TRN-02',
      name: 'Mandatory Paid Training / Certification Purchase Scheme',
      severity: 'CRITICAL',
      category: 'FINANCIAL',
      evidence: findQuote(trainingFeeRegex, 'Requirement to purchase third-party training or certificates prior to hiring.'),
      weight: 25,
      riskContribution: 25,
      explanation: 'Candidate is required to purchase paid courses or training certificates as a prerequisite to hiring.',
      whyItMatters: 'Predatory campaigns frequently disguise third-party training course sales as guaranteed job or internship offers.',
      mitigation: 'Verify if the company provides employer-funded onboarding; refuse mandatory paid prerequisites.'
    });
  }

  // 3. Equipment Purchase / Hardware Courier Deposit
  const equipRegex = /(?:laptop\s*deposit|kit\s*fee|courier\s*charge\s*for\s*equipment|hardware\s*security\s*deposit|dispatch\s*charge|equipment\s*fee)/i;
  if (equipRegex.test(text) && !isNegated('hardware') && !isNegated('laptop')) {
    signals.push({
      id: 'SIG-EQP-03',
      signalId: 'SIG-EQP-03',
      name: 'Hardware / Work-from-Home Kit Deposit Demand',
      severity: 'CRITICAL',
      category: 'FINANCIAL',
      evidence: findQuote(equipRegex, 'Deposit or courier fee requested for laptop or work equipment delivery.'),
      weight: 25,
      riskContribution: 25,
      explanation: 'Advance courier or security deposit demanded for company hardware kit dispatch.',
      whyItMatters: 'Corporate equipment is always shipped at the employer expense. Demanding courier/security money for laptops is a classic advance-fee scam vector.',
      mitigation: 'Do not pay for company hardware dispatch. Legitimate firms manage IT provisioning directly.'
    });
  }

  // 4. Credential Harvesting (OTP, Passwords, Banking Credentials, UPI PIN)
  if (entities.requestedCredentials.length > 0) {
    signals.push({
      id: 'SIG-CRD-04',
      signalId: 'SIG-CRD-04',
      name: 'Direct Credential / Authentication Harvesting',
      severity: 'CRITICAL',
      category: 'CREDENTIAL',
      evidence: `Requested sensitive credentials: ${entities.requestedCredentials.join(', ')}`,
      weight: 35,
      riskContribution: 35,
      explanation: 'Explicit request for passwords, OTP verification codes, banking PINs, or remote desktop control.',
      whyItMatters: 'No legitimate opportunity requires OTPs, passwords, UPI PINs, or remote desktop tools (AnyDesk/TeamViewer). This indicates an active account takeover attempt.',
      mitigation: 'Immediately terminate communication. Never disclose one-time passwords or bank pins.'
    });
  }

  // 5. Premature Sensitive Identity Document Extraction
  const hasHighRiskDocs = entities.requestedDocuments.some((d) =>
    ['Aadhaar Card', 'PAN Card', 'Social Security Number (SSN)', 'Debit / Credit Card Scan', 'Bank Statement / Cheque', 'Passport Copy'].includes(d)
  );
  if (hasHighRiskDocs && (lower.includes('send') || lower.includes('upload') || lower.includes('attach') || lower.includes('submit') || lower.includes('required') || lower.includes('mandatory'))) {
    signals.push({
      id: 'SIG-DOC-05',
      signalId: 'SIG-DOC-05',
      name: 'Premature Sensitive Identity Document Collection',
      severity: 'HIGH',
      category: 'IDENTITY',
      evidence: `Requested high-risk documents: ${entities.requestedDocuments.join(', ')}`,
      weight: 20,
      riskContribution: 20,
      explanation: 'Unsolicited request for government ID numbers, bank statements, or card scans before formal verified contracting.',
      whyItMatters: 'Requesting government identity numbers, PAN/Aadhaar/SSN scans, or bank cheques before formal interview completion or contract signing enables identity theft and loan fraud.',
      mitigation: 'Withhold national ID scans and bank account documents until official offer verification via verified corporate portals.'
    });
  }

  // 6. Urgency Manipulation & Artificial Pressure
  const urgencyRegex = /(?:within\s*24\s*hours?|within\s*48\s*hours?|urgent\s*joining|immediate\s*confirmation|pay\s*immediately|act\s*now|today\s*only|last\s*chance|offer\s*expires\s*(?:today|in\s*\d+\s*hours)|only\s*\d+\s*slots?\s*left|last\s*day\s*to\s*claim)/i;
  if (urgencyRegex.test(text) || entities.deadlines !== 'Not detected') {
    signals.push({
      id: 'SIG-URG-06',
      signalId: 'SIG-URG-06',
      name: 'Psychological Urgency & Artificial Deadline Pressure',
      severity: 'HIGH',
      category: 'URGENCY',
      evidence: findQuote(urgencyRegex, `Strict deadline pressure detected: "${entities.deadlines}"`),
      weight: 15,
      riskContribution: 15,
      explanation: 'Artificial 24-48h deadlines and scarcity tactics used to compel immediate compliance.',
      whyItMatters: 'Fraudulent campaigns induce urgency with hyper-short artificial windows (e.g. 24 hours, "slots expiring") to prevent targets from consulting mentors or conducting independent due diligence.',
      mitigation: 'Legitimate hiring cycles allow reasonable deliberation. Request formal written extension.'
    });
  }

  // 7. Unrealistic Compensation vs Experience Required (Daily/weekly low-skill lure)
  const isAnnualSalary = /(?:per\s*annum|per\s*year|\/year|\/annum|lpa|annual)/i.test(text);
  const unrealisticPayRegex = /(?:earn\s*(?:INR|Rs|₹|\$|USD|EUR|€)?\s*[3-9]\d,\d{3}\s*(?:per\s*week|per\s*day|weekly|daily)|daily\s*income\s*(?:INR|Rs|₹|\$)\s*[1-9]\d{3}|typing\s*job\s*[\d,]+|data\s*entry\s*(?:INR|₹)\s*[3-9]\d{3}\s*per\s*day|guaranteed\s*income|guaranteed\s*daily\s*payout)/i;
  
  if (unrealisticPayRegex.test(text) && !isAnnualSalary) {
    signals.push({
      id: 'SIG-PAY-07',
      signalId: 'SIG-PAY-07',
      name: 'Unrealistic Compensation for Entry-Level / Low-Skill Task',
      severity: 'HIGH',
      category: 'FINANCIAL',
      evidence: findQuote(unrealisticPayRegex, `Suspicious compensation structure: ${entities.salaryStipend}`),
      weight: 15,
      riskContribution: 15,
      explanation: 'Disproportionately high earnings promised for minimal routine entry-level effort.',
      whyItMatters: 'Inflated payouts for minimal effort (e.g. copying text, liking videos, review writing) are hallmark lure mechanics for task-based financial scams.',
      mitigation: 'Compare salary against standard industry benchmarks on Glassdoor, Levels.fyi, or AmbitionBox.'
    });
  }

  // 8. Fake Selection / Direct Offer Without Evaluation
  const fakeSelectionRegex = /(?:selected\s*directly|shortlisted\s*without\s*interview|no\s*interview\s*(?:required|needed)|congratulations\s*you\s*have\s*been\s*(?:directly\s*)?selected|congratulations!\s*you\s*are\s*selected|guaranteed\s*job|guaranteed\s*internship|direct\s*hiring\s*without\s*exam|selected\s*through\s*international\s*academic\s*merit\s*draw)/i;
  if (fakeSelectionRegex.test(text)) {
    signals.push({
      id: 'SIG-SEL-08',
      signalId: 'SIG-SEL-08',
      name: 'Direct Selection Without Assessment or Interview',
      severity: 'HIGH',
      category: 'PROCEDURE',
      evidence: findQuote(fakeSelectionRegex, 'Candidate declared selected without undergoing standard technical or HR screening.'),
      weight: 15,
      riskContribution: 15,
      explanation: 'Immediate hiring guarantee without technical assessment, screening rounds, or live interviews.',
      whyItMatters: 'Reputable organizations do not extend formal job or internship offers without conducting technical assessments, interviews, or identity verification.',
      mitigation: 'Inquire regarding the assessment rubric and request official interview panel details.'
    });
  }

  // 9. Free / Public Email Claiming Corporate Representation
  let emailDomain = '';
  if (entities.recruiterEmail !== 'Not detected') {
    const parts = entities.recruiterEmail.split('@');
    if (parts.length === 2) {
      emailDomain = parts[1].toLowerCase();
    }
  }

  const isPublicEmail = FREE_PUBLIC_EMAIL_DOMAINS.has(emailDomain);
  const matchedEnt = KNOWN_ENTERPRISES.find(
    (e) => e.name.toLowerCase() === entities.organization.toLowerCase()
  );
  const isCorporateClaim = matchedEnt !== undefined;

  if (isPublicEmail && isCorporateClaim) {
    signals.push({
      id: 'SIG-EML-09',
      signalId: 'SIG-EML-09',
      name: 'Public / Free Email Used For Enterprise Claim',
      severity: 'CRITICAL',
      category: 'COMMUNICATION',
      evidence: `Recruiter email "${entities.recruiterEmail}" uses public provider @${emailDomain} while claiming to represent enterprise "${entities.organization}".`,
      weight: 25,
      riskContribution: 25,
      explanation: 'Generic webmail (Gmail/Yahoo/Outlook) used while claiming affiliation with an established enterprise.',
      whyItMatters: 'Enterprise recruiters and university program coordinators exclusively correspond via official authenticated domain addresses, not generic Gmail/Yahoo accounts.',
      mitigation: 'Ask the recruiter to email you strictly from their official corporate @company.com domain.'
    });
  } else if (isPublicEmail && !isCorporateClaim && entities.recruiterEmail !== 'Not detected') {
    signals.push({
      id: 'SIG-EML-09B',
      signalId: 'SIG-EML-09B',
      name: 'Unverified Public Email Address for Organization',
      severity: 'MEDIUM',
      category: 'COMMUNICATION',
      evidence: `Sender contact uses generic webmail: ${entities.recruiterEmail}`,
      weight: 10,
      riskContribution: 10,
      explanation: 'Sender contact relies on unauthenticated personal webmail rather than a registered corporate domain.',
      whyItMatters: 'Early stage startups or freelance clients may occasionally use personal webmail, but identity cannot be cryptographically verified.',
      mitigation: 'Request verified portfolio links or escrow platform mediation (Upwork, Freelancer, Contra).'
    });
  }

  // 10. Corporate Domain Mismatch
  if (entities.organization !== 'Not detected' && emailDomain && !isPublicEmail) {
    if (matchedEnt) {
      const isOfficialMatch = matchedEnt.officialDomains.some((d) => emailDomain === d || emailDomain.endsWith(`.${d}`));
      if (!isOfficialMatch) {
        signals.push({
          id: 'SIG-DOM-10',
          signalId: 'SIG-DOM-10',
          name: 'Recruiter Domain Mismatch With Official Enterprise',
          severity: 'CRITICAL',
          category: 'ORGANIZATION',
          evidence: `Claimed organization is "${entities.organization}" (official domain: ${matchedEnt.officialDomains.join(', ')}), but recruiter domain is "@${emailDomain}".`,
          weight: 25,
          riskContribution: 25,
          explanation: 'Sender domain does not match verified authoritative corporate domain of the claimed enterprise.',
          whyItMatters: 'Domain spoofing and unauthorized lookalike domains are commonly used to impersonate multinational enterprises and bypass email filters.',
          mitigation: 'Navigate directly to the official careers site independently to verify the recruiter and role.'
        });
      }
    }
  }

  // 11. Suspicious URL Shorteners / Unofficial Form Links
  if (entities.opportunityUrl !== 'Not detected') {
    try {
      const parsedUrl = new URL(entities.opportunityUrl);
      const host = parsedUrl.hostname.toLowerCase();

      if (SUSPICIOUS_SHORTENERS.includes(host)) {
        signals.push({
          id: 'SIG-URL-11',
          signalId: 'SIG-URL-11',
          name: 'Obfuscated Link / URL Shortener Destination',
          severity: 'HIGH',
          category: 'COMMUNICATION',
          evidence: `Application or offer link uses URL shortener: ${entities.opportunityUrl}`,
          weight: 15,
          riskContribution: 15,
          explanation: 'Link obfuscation shortener used to conceal actual destination address.',
          whyItMatters: 'Shortened URLs conceal destination hostnames, frequently routing victims to credential-harvesting phishing forms or drive-by downloads.',
          mitigation: 'Expand the URL using unshortening security tools before clicking.'
        });
      } else if (host.includes('forms.gle') || host.includes('docs.google.com/forms')) {
        if (entities.organization !== 'Not detected') {
          signals.push({
            id: 'SIG-URL-12',
            signalId: 'SIG-URL-12',
            name: 'Generic Google Form Used for Enterprise Application',
            severity: 'HIGH',
            category: 'COMMUNICATION',
            evidence: `Enterprise role for "${entities.organization}" collected via unverified Google Form: ${entities.opportunityUrl}`,
            weight: 15,
            riskContribution: 15,
            explanation: 'Enterprise opportunity application routed through generic unauthenticated Google Form.',
            whyItMatters: 'Major enterprises process candidate applications through dedicated Applicant Tracking Systems (ATS), never standalone Google forms.',
            mitigation: 'Verify if the opportunity exists on the official careers page before submitting personal data.'
          });
        }
      }
    } catch {
      // invalid URL
    }
  }

  // 12. Migration to Unofficial Chat Channels (Telegram, WhatsApp)
  if (entities.communicationPlatform === 'Telegram' || entities.communicationPlatform === 'WhatsApp') {
    signals.push({
      id: 'SIG-CHN-13',
      signalId: 'SIG-CHN-13',
      name: 'Hiring Off-Platform / Communication on Encrypted Chat Apps',
      severity: 'HIGH',
      category: 'COMMUNICATION',
      evidence: `Recruitment engagement directed to ${entities.communicationPlatform}.`,
      weight: 15,
      riskContribution: 15,
      explanation: 'Recruitment communications steered to encrypted direct messaging platforms.',
      whyItMatters: 'Fraudulent operations steer targets off professional networks (LinkedIn, Naukri, Indeed) to Telegram or WhatsApp to evade platform fraud monitoring and maintain anonymity.',
      mitigation: 'Keep all job negotiations inside verified professional platforms or official corporate email.'
    });
  }

  // 13. Guaranteed Employment / 100% Placement Promises
  if (entities.claims.some((c) => c.includes('100% Guaranteed') || c.includes('Placement'))) {
    signals.push({
      id: 'SIG-CLM-14',
      signalId: 'SIG-CLM-14',
      name: 'Unconditional Guaranteed Employment / Placement Claim',
      severity: 'HIGH',
      category: 'PSYCHOLOGICAL',
      evidence: 'Explicit promise of 100% guaranteed job placement or guaranteed daily income.',
      weight: 15,
      riskContribution: 15,
      explanation: 'Unrealistic marketing claim guaranteeing 100% placement or zero-risk job offers.',
      whyItMatters: 'No legitimate organization can guarantee unconditional hiring or zero-risk income regardless of performance or business conditions.',
      mitigation: 'Treat all guaranteed employment promises with severe skepticism.'
    });
  }

  // 14. Scarcity & Limited Seats Pressure
  if (entities.claims.some((c) => c.includes('Limited Seat') || c.includes('Scarcity'))) {
    signals.push({
      id: 'SIG-FOM-15',
      signalId: 'SIG-FOM-15',
      name: 'Artificial Scarcity / Limited Slot Manipulation',
      severity: 'MEDIUM',
      category: 'URGENCY',
      evidence: 'High-pressure scarcity framing detected ("limited seats remaining", "urgent batch filling").',
      weight: 10,
      riskContribution: 10,
      explanation: 'Psychological scarcity pressure used to force rapid enrollment.',
      whyItMatters: 'Scarcity triggers rapid emotional compliance before the victim evaluates inconsistencies.',
      mitigation: 'Take time to verify credentials; authentic opportunities do not vanish in hours.'
    });
  }

  // 15. Task-Based / Review / Like Fraud Signals
  const taskScamRegex = /(?:like\s*(?:youtube|tiktok|instagram)\s*videos|hotel\s*review\s*task|product\s*rating|click\s*ads|daily\s*task\s*commission)/i;
  if (taskScamRegex.test(text)) {
    signals.push({
      id: 'SIG-TSK-16',
      signalId: 'SIG-TSK-16',
      name: 'Task-Based Rating / Prepaid Commission Scam Signature',
      severity: 'CRITICAL',
      category: 'PROCEDURE',
      evidence: findQuote(taskScamRegex, 'Task structure involves micro-tasks, review rating, video liking, or prepaid commission payouts.'),
      weight: 35,
      riskContribution: 35,
      explanation: 'Micro-task, video rating, or review submission structure with promised commission.',
      whyItMatters: 'This is the signature pattern of international task-scam syndicates where initial small payouts lure victims into large recharge deposits.',
      mitigation: 'Cease engagement immediately. Report the account and block incoming communication.'
    });
  }

  // ----------------------------------------------------
  // POSITIVE TRUST SIGNALS (Risk Reducers)
  // ----------------------------------------------------

  // Positive Signal 1: Official Corporate Domain Match
  if (entities.organization !== 'Not detected' && emailDomain && !isPublicEmail) {
    if (matchedEnt) {
      const isOfficialMatch = matchedEnt.officialDomains.some((d) => emailDomain === d || emailDomain.endsWith(`.${d}`));
      if (isOfficialMatch) {
        signals.push({
          id: 'SIG-POS-01',
          signalId: 'SIG-POS-01',
          name: 'Verified Official Corporate Domain Match',
          severity: 'POSITIVE',
          category: 'TRUST',
          evidence: `Recruiter domain @${emailDomain} matches official verified domain for ${entities.organization}.`,
          weight: -15,
          riskContribution: -15,
          explanation: 'Recruiter email domain directly matches official authoritative domain of the organization.',
          whyItMatters: 'Cryptographically verified corporate email correspondence strongly correlates with legitimate authorized talent acquisition.',
          mitigation: 'Ensure email headers pass SPF/DKIM validation in your mail client.'
        });
      }
    }
  }

  // Positive Signal 2: Verified Enterprise ATS Portal Link or Careers Domain
  if (entities.opportunityUrl !== 'Not detected') {
    try {
      const parsedUrl = new URL(entities.opportunityUrl);
      const host = parsedUrl.hostname.toLowerCase();
      const isAtsMatch =
        VERIFIED_ENTERPRISE_ATS_DOMAINS.some((ats) => host === ats || host.endsWith(`.${ats}`)) ||
        host.startsWith('careers.') ||
        (matchedEnt && matchedEnt.careersDomains.some((cd) => host === cd || host.endsWith(`.${cd}`)));

      if (isAtsMatch) {
        signals.push({
          id: 'SIG-POS-02',
          signalId: 'SIG-POS-02',
          name: 'Verified Enterprise Applicant Tracking System (ATS)',
          severity: 'POSITIVE',
          category: 'TRUST',
          evidence: `Application flows through recognized enterprise recruiting platform: ${host}`,
          weight: -15,
          riskContribution: -15,
          explanation: 'Opportunity hosted or managed via verified Applicant Tracking System.',
          whyItMatters: 'Recognized enterprise recruiting software (Greenhouse, Lever, Workday) or official corporate careers subdomain indicates structured corporate HR governance.',
          mitigation: 'Complete application via the secure portal.'
        });
      }
    } catch {
      // Ignore
    }
  }

  // Positive Signal 3: Documented Multi-Stage Interview Process
  const multiStageRegex = /(?:round\s*1|technical\s*assessment|coding\s*round|behavioral\s*interview|panel\s*interview|hiring\s*manager\s*round|system\s*design|interview\s*stages)/i;
  if (multiStageRegex.test(text) && !fakeSelectionRegex.test(text)) {
    signals.push({
      id: 'SIG-POS-03',
      signalId: 'SIG-POS-03',
      name: 'Documented Multi-Stage Assessment Workflow',
      severity: 'POSITIVE',
      category: 'TRUST',
      evidence: findQuote(multiStageRegex, 'Standard hiring process documented with technical assessments and panel interviews.'),
      weight: -10,
      riskContribution: -10,
      explanation: 'Documented multi-stage technical and behavioral evaluation process.',
      whyItMatters: 'Structured evaluation rounds reflect legitimate talent screening standards.',
      mitigation: 'Prepare portfolio and technical materials for scheduled rounds.'
    });
  }

  // Positive Signal 4: Explicit Zero-Fee Policy / No Payment Demand
  const zeroFeeRegex = /(?:we\s*never\s*ask\s*for\s*money|no\s*application\s*fee|free\s*of\s*charge|zero\s*recruitment\s*fee|equal\s*opportunity\s*employer|never\s*requests?\s*(?:application\s*)?fees|zero\s*fee)/i;
  if (zeroFeeRegex.test(text) && entities.paymentAmount === 'Not detected') {
    signals.push({
      id: 'SIG-POS-04',
      signalId: 'SIG-POS-04',
      name: 'Explicit Anti-Fee Disclosure & Equal Opportunity Statement',
      severity: 'POSITIVE',
      category: 'TRUST',
      evidence: findQuote(zeroFeeRegex, 'Clear corporate declaration that recruitment is 100% free with no candidate fee collection.'),
      weight: -5,
      riskContribution: -5,
      explanation: 'Explicit anti-scam disclosure confirming recruitment is 100% free of charge.',
      whyItMatters: 'Reputable employers proactively clarify zero-fee policies to protect applicants from impersonators.',
      mitigation: 'Proceed through standard company portal.'
    });
  }

  // Positive Signal 5: Accredited Academic / Governmental / Open Source Domain
  if (entities.website !== 'Not detected' || entities.opportunityUrl !== 'Not detected') {
    const webOrUrl = (entities.website + ' ' + entities.opportunityUrl).toLowerCase();
    if (webOrUrl.includes('.ac.in') || webOrUrl.includes('.edu') || webOrUrl.includes('.gov') || webOrUrl.includes('.org') || webOrUrl.includes('github.com')) {
      signals.push({
        id: 'SIG-POS-05',
        signalId: 'SIG-POS-05',
        name: 'Accredited Academic / Institutional / Open Source Infrastructure',
        severity: 'POSITIVE',
        category: 'TRUST',
        evidence: `Opportunity hosted on verified institutional or open-source infrastructure: ${entities.website !== 'Not detected' ? entities.website : entities.opportunityUrl}`,
        weight: -15,
        riskContribution: -15,
        explanation: 'Institutional top-level domain (.edu, .ac.in, .gov, .org, github.com) verified.',
        whyItMatters: 'Academic (.ac.in/.edu) and governmental registries require authenticated organizational credentials before registration.',
        mitigation: 'Verify guidelines directly on the official institutional portal.'
      });
    }
  }

  return signals;
}
