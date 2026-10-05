import { ExtractedOpportunity, OpportunityType } from './types.js';
import { KNOWN_ENTERPRISES } from './knownDatabases.js';

export function extractEntities(rawText: string): ExtractedOpportunity {
  const text = rawText || '';
  
  // 1. Extract Emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emails = Array.from(text.matchAll(emailRegex)).map((m) => m[0]);
  const recruiterEmail = emails.length > 0 ? emails[0] : 'Not detected';

  // 2. Extract URLs
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;
  const urls = Array.from(text.matchAll(urlRegex)).map((m) => m[0]);
  const opportunityUrl = urls.length > 0 ? urls[0] : 'Not detected';

  // 3. Extract Website / Domains
  let website = 'Not detected';
  if (urls.length > 0) {
    try {
      const parsed = new URL(urls[0]);
      website = parsed.hostname;
    } catch {
      website = 'Not detected';
    }
  }

  // 4. Extract Phone Numbers
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}|[6-9]\d{9}/g;
  const phones = Array.from(text.matchAll(phoneRegex)).map((m) => m[0]);
  const phoneNumber = phones.length > 0 ? phones[0] : 'Not detected';

  // 5. Detect Organization
  let organization = 'Not detected';
  for (const ent of KNOWN_ENTERPRISES) {
    const isMatch = [ent.name, ...ent.aliases].some((alias) => {
      const aliasReg = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (!aliasReg.test(text)) return false;
      
      // If enterprise is Google or Microsoft, check if it's only mentioned as a tool (e.g., Google Meet, Google Form, Microsoft Teams)
      if (alias.toLowerCase() === 'google' || alias.toLowerCase() === 'microsoft') {
        const textWithoutTools = text.replace(/google\s+(?:meet|form|forms|drive|doc|docs|classroom)/gi, '')
                                     .replace(/microsoft\s+(?:teams|word|excel|powerpoint)/gi, '');
        return aliasReg.test(textWithoutTools);
      }
      return true;
    });

    if (isMatch) {
      organization = ent.name;
      if (website === 'Not detected') {
        website = ent.officialDomains[0];
      }
      break;
    }
  }

  if (organization === 'Not detected') {
    const invalidOrgWords = new Set([
      'dear', 'candidate', 'applicant', 'congratulations', 'details', 'more info',
      'more information', 'info', 'further details', 'further information', 'free',
      'you', 'your', 'our', 'this', 'that', 'the', 'an', 'a', 'everyone', 'anyone',
      'all', 'interview', 'selection', 'joining', 'onboarding', 'contact', 'contact us',
      'registration', 'stipend', 'salary', 'fees', 'fee', 'payment', 'apply', 'applying',
      'help', 'support', 'queries', 'questions', 'now', 'today'
    ]);

    const orgRegexes = [
      /(?:at|for|from|with|company:?|organization:?)\s+([A-Z][A-Za-z0-9&.\s]{2,25}(?:Technologies|Tech|Solutions|Pvt\s+Ltd|Inc|LLC|Corp|Labs|Services|Infotech|Media|Ventures|Enterprises|Studio|Agency)?)/,
      /([A-Z][A-Za-z0-9&.\s]{2,25})\s+(?:is hiring|is offering|presents|recruitment team|careers|Summer Research Fellowship)/i
    ];
    for (const reg of orgRegexes) {
      const match = text.match(reg);
      if (match && match[1]) {
        let candidate = match[1].replace(/[.,:;!?]+$/, '').trim();
        const candLower = candidate.toLowerCase();
        if (
          !invalidOrgWords.has(candLower) &&
          !Array.from(invalidOrgWords).some((w) => candLower === w || candLower.startsWith(w + ' ')) &&
          candidate.length > 2 &&
          candidate.length < 40
        ) {
          organization = candidate;
          break;
        }
      }
    }
  }

  // 6. Detect Opportunity Type
  let opportunityType: OpportunityType = 'Unspecified';
  const lower = text.toLowerCase();
  if (lower.includes('internship') || lower.includes('intern ') || lower.includes('interns ')) {
    opportunityType = 'Internship';
  } else if (lower.includes('scholarship') || lower.includes('fellowship') || lower.includes('grant ')) {
    opportunityType = 'Scholarship / Grant';
  } else if (lower.includes('bootcamp') || lower.includes('training program') || lower.includes('certification course')) {
    opportunityType = 'Training / Bootcamp';
  } else if (lower.includes('freelance') || lower.includes('part-time') || lower.includes('part time') || lower.includes('hourly gig')) {
    opportunityType = 'Freelance Project';
  } else if (lower.includes('research assistant') || lower.includes('research fellowship')) {
    opportunityType = 'Research Program';
  } else if (lower.includes('full-time') || lower.includes('full time') || lower.includes('job offer') || lower.includes('employment offer') || lower.includes('software engineer') || lower.includes('developer') || lower.includes('analyst')) {
    opportunityType = 'Full-time Job';
  }

  // 7. Detect Job / Internship Title
  let jobTitle = 'Not detected';
  const roleRegexes = [
    /(?:role|position|profile|title|post|hiring for):?\s*([A-Za-z0-9\s/&-]{3,40})/i,
    /(?:as a|as an)\s+([A-Za-z0-9\s/&-]{3,35}(?:Intern|Developer|Engineer|Designer|Analyst|Associate|Consultant|Executive|Manager|Assistant))/i,
    /([A-Za-z0-9\s/&-]{3,35}\s+(?:Internship|Position|Role|Opening))/i
  ];
  for (const reg of roleRegexes) {
    const m = text.match(reg);
    if (m && m[1]) {
      const clean = m[1].trim();
      if (clean.length > 2 && clean.length < 50) {
        jobTitle = clean;
        break;
      }
    }
  }
  if (jobTitle === 'Not detected' && opportunityType !== 'Unspecified') {
    jobTitle = `${opportunityType} Opportunity`;
  }

  // 8. Detect Recruiter Name
  let recruiter = 'Not detected';
  const recruiterRegexes = [
    /(?:Regards|Best Regards|Sincerely|Thanks & Regards|From|Contact HR|HR Manager|Talent Acquisition),?\s*\n?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /(?:I am|My name is|This is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:from|representing|HR|Talent)/i
  ];
  for (const reg of recruiterRegexes) {
    const m = text.match(reg);
    if (m && m[1]) {
      recruiter = m[1].trim();
      break;
    }
  }

  // 9. Detect Compensation / Salary / Stipend (Paid TO candidate)
  let salaryStipend = 'Not detected';
  const salaryRegexes = [
    /(?:stipend|salary|ctc|package|compensation|pay|payout):?\s*(?:INR|Rs\.?|₹|\$|EUR|€|£|GBP)?\s*[\d,]+(?:\s*(?:k|lakh|lpa|per month|\/month|\/hr|per day|\/week|pm|USD|EUR|GBP))?/i,
    /(?:monthly\s*stipend|monthly\s*salary|hourly\s*rate):?\s*(?:INR|Rs\.?|₹|\$|EUR|€|£|GBP)?\s*[\d,]+/i,
    /(?:INR|Rs\.?|₹|\$|EUR|€|£|GBP)\s*[\d,]+(?:\s*(?:per month|\/month|monthly|\/day|per day|per week|\/week|pm|lpa|USD|EUR|GBP))/i
  ];
  for (const reg of salaryRegexes) {
    const m = text.match(reg);
    if (m && m[0]) {
      salaryStipend = m[0].trim();
      break;
    }
  }

  // 10. Detect Payment Demand / Fee Amount & Purpose (Demanded FROM candidate)
  let paymentAmount = 'Not detected';
  let paymentPurpose = 'Not detected';
  let paymentRequested = false;

  // Explicit check: Ignore payment if text says "never requests fees", "zero cost", "100% sponsored"
  const isAntiFeeDisclaimer = /never\s*requests?\s*(?:application\s*)?fees|zero\s*(?:cost|recruitment\s*fee|fee)|100%\s*(?:free|sponsored)|costs?\s+(?:are\s+)?100%\s+sponsored/i.test(text);

  const feeRegexes = [
    /(?:deposit|registration\s*fee|processing\s*fee|security\s*deposit|refundable\s*deposit|training\s*fee|onboarding\s*fee|kit\s*fee|clearance\s*fee|application\s*fee|courier\s*fee|equipment\s*deposit)\s*(?:of|is|:)?\s*(?:INR|Rs\.?|₹|\$|USD|EUR|€|£|GBP|USDT)?\s*([\d,]+(?:\s*(?:USD|EUR|GBP|USDT|INR|Rs|₹|\$))?)/i,
    /(?:pay|deposit|transfer|send|require|requires)\s+(?:an?\s+)?(?:upfront\s+)?(?:INR|Rs\.?|₹|\$|USD|EUR|€|£|GBP|USDT)\s*([\d,]+(?:\s*(?:USD|EUR|GBP|USDT))?)/i,
    /(?:INR|Rs\.?|₹|\$|USD|EUR|€|£|GBP|USDT)\s*([\d,]+(?:\s*(?:USD|EUR|GBP|USDT))?)\s*(?:as|for|towards|in)?\s*(?:registration|security|deposit|training|kit|laptop|clearance|processing|fee|foreign\s*currency)/i
  ];

  const isFeeContext = /(?:registration\s*fee|processing\s*fee|security\s*deposit|courier\s*charge|kit\s*fee|clearance\s*fee|pay\s*(?:INR|Rs|₹|\$)\s*[\d,]+|deposit\s*to\s*hr)/i.test(text);

  for (const reg of feeRegexes) {
    const m = text.match(reg);
    if (m && !isAntiFeeDisclaimer && isFeeContext) {
      let rawAmount = m[0].trim();
      // Ensure amount is not preceded by salary/stipend/base
      const mIdx = text.indexOf(m[0]);
      if (mIdx > 0) {
        const preceding = text.substring(Math.max(0, mIdx - 25), mIdx).toLowerCase();
        if (/salary|stipend|base|package|ctc|lpa|sponsored|stipend\s*of/i.test(preceding)) {
          continue;
        }
      }
      rawAmount = rawAmount.replace(/^(?:pay|deposit|transfer|send|require|requires|an?|upfront|refundable)\s+/i, '').trim();
      paymentAmount = rawAmount;
      paymentRequested = true;
      break;
    }
  }

  const purposeRegexes = [
    /(?:for|towards|as a|for the)\s+([A-Za-z\s]{3,45}(?:registration|deposit|training|kit|laptop|background check|verification|slot reservation|certificate|seat|clearance|fee))/i,
    /(registration fee|refundable security deposit|training charge|onboarding kit fee|processing charge|exam fee|platform charge|disbursement clearance fee|clearance fee)/i
  ];
  for (const reg of purposeRegexes) {
    const m = text.match(reg);
    if (m && m[1] && !isAntiFeeDisclaimer) {
      paymentPurpose = m[1].trim();
      paymentRequested = true;
      break;
    }
  }

  // 11. Detect Deadlines & Urgency
  let deadlines = 'Not detected';
  const deadlineRegexes = [
    /(?:within|in|before|by|deadline:?|valid for|expires in)\s+([0-9]+\s*(?:hours|hrs|days|mins|minutes|pm|am|tonight|today|tomorrow))/i,
    /(last date(?:\s+is)?:?\s*[A-Za-z0-9, -]{3,25})/i,
    /(immediate joining|urgent joining|confirm within 24 hours|confirm within 48 hours|slots valid for today only)/i
  ];
  for (const reg of deadlineRegexes) {
    const m = text.match(reg);
    if (m && m[0]) {
      deadlines = m[0].trim();
      break;
    }
  }

  // 12. Detect Requested Sensitive Documents
  const requestedDocuments: string[] = [];
  const docKeywords = [
    { label: 'Aadhaar Card', regex: /aadhaar|adhar|uidai/i },
    { label: 'PAN Card', regex: /pan card|pan number/i },
    { label: 'Passport Copy', regex: /passport copy|passport scan/i },
    { label: 'Bank Statement / Cheque', regex: /bank statement|voided che?que|bank account passbook/i },
    { label: 'Social Security Number (SSN)', regex: /ssn|social security/i },
    { label: 'Debit / Credit Card Scan', regex: /card details|card scan|cvv/i },
    { label: 'Government Photo ID', regex: /gov(?:ernment)?\s*id|national id|voter id|driving licen[sc]e/i }
  ];
  for (const item of docKeywords) {
    if (item.regex.test(text)) {
      requestedDocuments.push(item.label);
    }
  }

  // 13. Detect Requested Credentials / Auth Details
  const requestedCredentials: string[] = [];
  const credKeywords = [
    { label: 'One-Time Password (OTP)', regex: /otp|one[\s-]time\s*password|verification code/i },
    { label: 'Account Password / Login Credentials', regex: /password|account login credentials|pin|netbanking login/i },
    { label: 'UPI PIN / MPIN', regex: /upi pin|mpin|gpay pin/i },
    { label: 'Remote Desktop Tool Access', regex: /anydesk|teamviewer|ultraviewer|rustdesk/i }
  ];
  for (const item of credKeywords) {
    if (item.regex.test(text)) {
      requestedCredentials.push(item.label);
    }
  }

  // 14. Detect Location & Work Mode
  let location = 'Not detected';
  if (/work from home|wfh|remote|virtual/i.test(text)) {
    location = 'Remote / Work From Home';
  } else if (/hybrid/i.test(text)) {
    location = 'Hybrid';
  } else {
    const locMatch = text.match(/(?:location|based in|office in|at):?\s*([A-Z][a-zA-Z\s,]{3,30})/);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].trim();
    }
  }

  // 15. Detect Communication Platform
  let communicationPlatform = 'Email / Official Web';
  if (/telegram|t\.me/i.test(text)) {
    communicationPlatform = 'Telegram';
  } else if (/whatsapp|wa\.me/i.test(text)) {
    communicationPlatform = 'WhatsApp';
  } else if (/signal/i.test(text)) {
    communicationPlatform = 'Signal';
  } else if (/discord/i.test(text)) {
    communicationPlatform = 'Discord';
  } else if (/sms|text message/i.test(text)) {
    communicationPlatform = 'Direct SMS';
  }

  // 16. Detect Application & Selection Method
  let applicationMethod = 'Standard Direct Inquiry';
  if (/selected without interview|direct selection|no interview required|profile shortlisted directly|congratulations you have been selected/i.test(text)) {
    applicationMethod = 'Direct Selection Without Interview (Unverified)';
  } else if (/google form|forms\.gle/i.test(text)) {
    applicationMethod = 'Unverified Google Form';
  } else if (/telegram bot|message our hr on telegram/i.test(text)) {
    applicationMethod = 'Telegram Chat Bot';
  } else if (/careers\.|greenhouse|lever|workday/i.test(text)) {
    applicationMethod = 'Official ATS Portal';
  }

  // 17. Detect Notable Claims
  const claims: string[] = [];
  if (/100%\s*(?:placement|guarantee|job guarantee)/i.test(text)) {
    claims.push('100% Guaranteed Employment Claim');
  }
  if (/daily\s*(?:payout|payment|income)/i.test(text)) {
    claims.push('Daily Guaranteed Payout Claim');
  }
  if (/earn\s*(?:up to)?\s*(?:INR|₹|\$)\s*[\d,]+\s*per day/i.test(text)) {
    claims.push('High Daily Earnings For Simple Tasks');
  }
  if (/limited\s*(?:seats|slots|openings)\s*(?:left|available)/i.test(text)) {
    claims.push('Artificial Limited Seat Scarcity');
  }
  if (/refundable\s*(?:deposit|after|fee)/i.test(text)) {
    claims.push('Refundable Security Deposit Promise');
  }

  return {
    title: jobTitle,
    jobTitle,
    organization,
    recruiter,
    email: recruiterEmail,
    recruiterEmail,
    phone: phoneNumber,
    phoneNumber,
    website,
    url: opportunityUrl,
    opportunityUrl,
    type: opportunityType,
    opportunityType,
    location,
    compensation: salaryStipend,
    salaryStipend,
    paymentRequested,
    paymentAmount,
    paymentReason: paymentPurpose,
    paymentPurpose,
    deadline: deadlines,
    deadlines,
    requestedDocuments,
    requestedCredentials,
    communicationPlatform,
    applicationMethod,
    claims
  };
}
