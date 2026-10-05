import {
  ExtractedOpportunity,
  OrgConsistencyVector,
  VerificationCenterData,
  VerificationClaim,
  ExternalEvidenceItem,
  ExternalVerificationContext
} from './types.js';
import { verifyDns, verifyTls, verifyEmailInfrastructure, verifyRdap } from './network/verificationProviders.js';
import { safeNetworkFetch } from './network/safeNetworkClient.js';

// Enterprise official domain mapping registry
const OFFICIAL_ORG_REGISTRY: {
  [alias: string]: {
    canonicalName: string;
    officialDomain: string;
    careersPortal: string;
    atsPrefixes: string[];
  };
} = {
  google: {
    canonicalName: 'Google LLC',
    officialDomain: 'google.com',
    careersPortal: 'https://careers.google.com',
    atsPrefixes: ['careers.google.com', 'google.com']
  },
  microsoft: {
    canonicalName: 'Microsoft Corporation',
    officialDomain: 'microsoft.com',
    careersPortal: 'https://careers.microsoft.com',
    atsPrefixes: ['careers.microsoft.com', 'microsoft.com']
  },
  tcs: {
    canonicalName: 'Tata Consultancy Services',
    officialDomain: 'tcs.com',
    careersPortal: 'https://www.tcs.com/careers',
    atsPrefixes: ['tcs.com', 'nextstep.tcs.com', 'ibegin.tcs.com']
  },
  'tata consultancy services': {
    canonicalName: 'Tata Consultancy Services',
    officialDomain: 'tcs.com',
    careersPortal: 'https://www.tcs.com/careers',
    atsPrefixes: ['tcs.com', 'nextstep.tcs.com', 'ibegin.tcs.com']
  },
  amazon: {
    canonicalName: 'Amazon.com, Inc.',
    officialDomain: 'amazon.com',
    careersPortal: 'https://amazon.jobs',
    atsPrefixes: ['amazon.jobs', 'amazon.com']
  },
  apple: {
    canonicalName: 'Apple Inc.',
    officialDomain: 'apple.com',
    careersPortal: 'https://jobs.apple.com',
    atsPrefixes: ['jobs.apple.com', 'apple.com']
  },
  meta: {
    canonicalName: 'Meta Platforms, Inc.',
    officialDomain: 'meta.com',
    careersPortal: 'https://metacareers.com',
    atsPrefixes: ['metacareers.com', 'meta.com']
  },
  infosys: {
    canonicalName: 'Infosys Limited',
    officialDomain: 'infosys.com',
    careersPortal: 'https://www.infosys.com/careers',
    atsPrefixes: ['infosys.com', 'career.infosys.com']
  },
  wipro: {
    canonicalName: 'Wipro Limited',
    officialDomain: 'wipro.com',
    careersPortal: 'https://careers.wipro.com',
    atsPrefixes: ['wipro.com', 'careers.wipro.com']
  },
  accenture: {
    canonicalName: 'Accenture plc',
    officialDomain: 'accenture.com',
    careersPortal: 'https://www.accenture.com/careers',
    atsPrefixes: ['accenture.com']
  },
  ibm: {
    canonicalName: 'IBM Corporation',
    officialDomain: 'ibm.com',
    careersPortal: 'https://www.ibm.com/employment',
    atsPrefixes: ['ibm.com']
  }
};

/**
 * Detects look-alike / typosquatting domain patterns
 */
// Domains registered more recently than this are treated as new (common for disposable scam sites)
const NEW_DOMAIN_DAYS = 180;

export function checkLookalikeDomain(
  submittedHost: string,
  targetBrand: string
): { isLookalike: boolean; rationale: string } {
  const host = submittedHost.toLowerCase().trim();
  const brand = targetBrand.toLowerCase().trim();

  if (!brand || !host) return { isLookalike: false, rationale: '' };

  // Common l33t substitutions: 0 -> o, 1 -> l, etc.
  const normalizedHost = host.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e');

  // Deceptive hyphen compounds: e.g. google-careers-india.com or tcs-internships-2026.net
  if (host.includes(brand) && (host.includes('-') || host.includes('careers') || host.includes('jobs') || host.includes('internship'))) {
    // If it is NOT a direct official subdomain of brand.com
    if (!host.endsWith(`.${brand}.com`) && host !== `${brand}.com`) {
      return {
        isLookalike: true,
        rationale: `Host "${host}" embeds brand keyword "${brand}" with misleading hyphens/subdomains (potential look-alike domain).`
      };
    }
  }

  // Levenshtein distance check on normalized brand
  if (normalizedHost.includes(brand) && host !== `${brand}.com` && !host.endsWith(`.${brand}.com`)) {
    return {
      isLookalike: true,
      rationale: `Host "${host}" is deceptively similar to official brand "${brand}.com".`
    };
  }

  return { isLookalike: false, rationale: '' };
}

/**
 * Generates structured Verification Center data and Cross-Source Matrix
 */
export async function verifyOpportunityClaims(
  entities: ExtractedOpportunity,
  orgConsistency: OrgConsistencyVector,
  rawSnippet: string
): Promise<VerificationCenterData> {
  const orgKey = entities.organization.toLowerCase().trim();
  const matchedOrg = OFFICIAL_ORG_REGISTRY[orgKey];

  let officialDomain = 'Not indexed';
  let submittedDomain = entities.website !== 'Not detected' ? entities.website : 'Not provided';
  let domainStatus: 'MATCH' | 'MISMATCH' | 'LOOKALIKE' | 'UNVERIFIED' = 'UNVERIFIED';

  if (matchedOrg) {
    officialDomain = matchedOrg.officialDomain;
  }

  // Extract host from submitted URL if available
  let submittedHost = '';
  if (submittedDomain !== 'Not provided' && submittedDomain !== 'Not detected') {
    try {
      const parsed = new URL(submittedDomain.startsWith('http') ? submittedDomain : `https://${submittedDomain}`);
      submittedHost = parsed.hostname;
    } catch {
      submittedHost = submittedDomain;
    }
  }

  // Check look-alike if brand was extracted
  const lookalikeCheck = checkLookalikeDomain(submittedHost, orgKey);

  if (lookalikeCheck.isLookalike) {
    domainStatus = 'LOOKALIKE';
  } else if (matchedOrg && submittedHost) {
    if (submittedHost === matchedOrg.officialDomain || submittedHost.endsWith(`.${matchedOrg.officialDomain}`)) {
      domainStatus = 'MATCH';
    } else {
      domainStatus = 'MISMATCH';
    }
  } else if (submittedHost) {
    domainStatus = 'UNVERIFIED';
  }

  // Network Verification Phase
  const externalContext: ExternalVerificationContext = {};
  let websiteAvailability: 'REACHABLE' | 'UNREACHABLE' | 'TIMEOUT' | 'UNAVAILABLE' = 'UNAVAILABLE';
  
  if (submittedHost && submittedHost !== 'Not provided' && submittedHost !== 'Not detected' && !submittedHost.includes(' ')) {
    externalContext.dns = await verifyDns(submittedHost);
    externalContext.tls = await verifyTls(submittedHost);
    externalContext.emailAuth = await verifyEmailInfrastructure(submittedHost);
    externalContext.rdap = await verifyRdap(submittedHost);

    if (externalContext.dns.status === 'VERIFIED') {
      try {
        const fetchRes = await safeNetworkFetch(`https://${submittedHost}`, { timeoutMs: 3000 });
        if (fetchRes.statusCode >= 200 && fetchRes.statusCode < 400) {
          websiteAvailability = 'REACHABLE';
        } else {
          websiteAvailability = 'UNREACHABLE';
        }
      } catch (e) {
        websiteAvailability = 'TIMEOUT';
      }
    } else {
      websiteAvailability = 'UNREACHABLE';
    }
  }

  // Opportunity Existence on Official Source
  let opportunityExistence: 'FOUND_ON_OFFICIAL_SOURCE' | 'NOT_FOUND' | 'SEARCH_UNAVAILABLE' | 'NOT_CHECKED' = 'NOT_CHECKED';
  if (matchedOrg) {
    if (rawSnippet.toLowerCase().includes('careers.google.com') || rawSnippet.toLowerCase().includes('amazon.jobs') || domainStatus === 'MATCH') {
      opportunityExistence = 'FOUND_ON_OFFICIAL_SOURCE';
    } else {
      opportunityExistence = 'NOT_FOUND';
    }
  } else {
    opportunityExistence = 'SEARCH_UNAVAILABLE';
  }

  // 1. Build Claims Verification Matrix (Section 1 & 12)
  const claims: VerificationClaim[] = [];

  // Claim 1: Organization Identity
  claims.push({
    claim: 'Organization Identity',
    submitted: entities.organization !== 'Not detected' ? entities.organization : 'Unspecified',
    external: matchedOrg ? matchedOrg.canonicalName : 'Independent / Unindexed Entity',
    status: matchedOrg ? 'CONSISTENT' : 'UNVERIFIED',
    rationale: matchedOrg
      ? `Claimed organization matches indexed enterprise record (${matchedOrg.canonicalName}).`
      : 'Organization name could not be cross-referenced against major enterprise registries.'
  });

  // Claim 2: Official Web Domain
  claims.push({
    claim: 'Official Web Domain',
    submitted: submittedDomain,
    external: officialDomain,
    status: domainStatus === 'MATCH' ? 'CONSISTENT' : domainStatus === 'MISMATCH' || domainStatus === 'LOOKALIKE' ? 'MISMATCH' : 'UNVERIFIED',
    rationale: domainStatus === 'MATCH'
      ? 'Submitted domain matches the official enterprise domain and its live DNS/TLS records.'
      : domainStatus === 'LOOKALIKE'
      ? lookalikeCheck.rationale
      : domainStatus === 'MISMATCH'
      ? `Submitted domain (${submittedDomain}) does not match the organization's official domain (${officialDomain}).`
      : 'Domain could not be independently cross-verified.'
  });

  // Claim 3: Recruiter Contact Channel
  const isPublicEmail = orgConsistency.recruiterDomainStatus === 'PUBLIC_FREE_EMAIL';
  const isOfficialEmail = orgConsistency.recruiterDomainStatus === 'OFFICIAL_MATCH';
  claims.push({
    claim: 'Recruiter Contact Channel',
    submitted: entities.recruiterEmail !== 'Not detected' ? entities.recruiterEmail : (entities.communicationPlatform !== 'Standard Email' ? entities.communicationPlatform : 'Unspecified'),
    external: matchedOrg ? `@${matchedOrg.officialDomain}` : 'Corporate Mailbox',
    status: isOfficialEmail ? 'CONSISTENT' : isPublicEmail && matchedOrg ? 'MISMATCH' : isPublicEmail ? 'UNVERIFIED' : 'UNVERIFIED',
    rationale: isOfficialEmail
      ? 'Recruiter contact originates from verified corporate email domain.'
      : isPublicEmail && matchedOrg
      ? `Recruiter utilizes public email provider (${entities.recruiterEmail}) while claiming affiliation with ${entities.organization}.`
      : isPublicEmail
      ? 'Recruiter uses public email provider (acceptable for small teams, requires independent confirmation).'
      : 'Recruiter contact handle could not be independently verified.'
  });

  // Claim 4: Opportunity Listing
  claims.push({
    claim: 'Opportunity Career Listing',
    submitted: entities.jobTitle,
    external: matchedOrg ? `${matchedOrg.careersPortal}` : 'Official Careers Source',
    status: opportunityExistence === 'FOUND_ON_OFFICIAL_SOURCE' ? 'VERIFIED' : opportunityExistence === 'NOT_FOUND' ? 'UNVERIFIED' : 'UNAVAILABLE',
    rationale: opportunityExistence === 'FOUND_ON_OFFICIAL_SOURCE'
      ? 'Opportunity requisition route matches official corporate candidate portal.'
      : opportunityExistence === 'NOT_FOUND'
      ? 'The opportunity could not be located on the checked official careers source (not proof of fraud, but requires verification).'
      : 'External careers search was unavailable for this unindexed entity.'
  });

  // Claim 5: Website Infrastructure & Protocol
  if (submittedHost) {
    claims.push({
      claim: 'Website Reachability & TLS Protocol',
      submitted: submittedDomain,
      external: `HTTPS check // ${submittedHost}`,
      status: websiteAvailability === 'REACHABLE' && externalContext.tls?.status === 'VERIFIED' ? 'CONSISTENT' : 'UNAVAILABLE',
      rationale: websiteAvailability === 'REACHABLE'
        ? `Website host (${submittedHost}) is reachable. Reachability does not imply legitimacy.`
        : 'Submitted website host was unreachable or timed out during inspection.'
    });
  }
  
  // Claim 6: Registration Trust (age computed from the RDAP registration date;
  // previously every dated domain was treated as "new" because only the note text was checked)
  const registeredAt = externalContext.rdap?.registrationDate ? new Date(externalContext.rdap.registrationDate).getTime() : NaN;
  const domainAgeDays = Number.isNaN(registeredAt) ? null : Math.floor((Date.now() - registeredAt) / 86_400_000);
  if (externalContext.rdap && externalContext.rdap.status === 'AVAILABLE' && domainAgeDays !== null) {
    const isNew = domainAgeDays < NEW_DOMAIN_DAYS;
    claims.push({
      claim: 'Domain Registration Age',
      submitted: submittedDomain,
      external: externalContext.rdap.registrationDate || 'Unknown',
      status: isNew ? 'UNVERIFIED' : 'CONSISTENT',
      rationale: isNew ? 'Domain was recently registered (common in disposable infrastructure).' : 'Domain has established registration history.'
    });
  }

  // Calculate Evidence Verification Percentage (% of claims checked)
  const verifiableClaims = claims.filter((c) => c.status !== 'UNAVAILABLE' && c.status !== 'NOT_CHECKED');
  const checkedClaims = claims.filter((c) => c.status === 'VERIFIED' || c.status === 'CONSISTENT' || c.status === 'MISMATCH');
  const evidenceVerificationPercent = Math.round((checkedClaims.length / Math.max(1, verifiableClaims.length)) * 100);

  // Trust Score Calculation (Based on positive evidence, NOT 100-Risk)
  let trustScore = 10; // Base trust
  const positiveTrustFactors: string[] = [];
  
  if (matchedOrg) {
    trustScore += 20;
    positiveTrustFactors.push('Recognized enterprise organization');
  }
  if (domainStatus === 'MATCH') {
    trustScore += 30;
    positiveTrustFactors.push('Authenticated official web domain');
  }
  if (isOfficialEmail) {
    trustScore += 20;
    positiveTrustFactors.push('Verified corporate email channel');
  }
  if (externalContext.tls?.status === 'VERIFIED') {
    trustScore += 10;
    positiveTrustFactors.push('Cryptographically secured connection (TLS)');
  }
  if (externalContext.emailAuth?.spfStatus === 'SPF_PRESENT') {
    trustScore += 5;
    positiveTrustFactors.push('Email spoofing protection enabled (SPF)');
  }
  if (externalContext.rdap?.status === 'AVAILABLE' && domainAgeDays !== null && domainAgeDays >= NEW_DOMAIN_DAYS) {
    trustScore += 5;
    positiveTrustFactors.push('Established domain registration age');
  }

  trustScore = Math.min(100, trustScore);

  let trustRationale = '';
  if (positiveTrustFactors.length > 0) {
    trustRationale = `Trust score is built from verifiable positive indicators: ${positiveTrustFactors.join(', ')}.`;
  } else {
    trustRationale = 'No positive verifiable trust indicators were detected. Proceed with extreme caution.';
  }

  // Verification Confidence Calculation
  let verificationConfidence = 0;
  if (submittedHost && submittedHost !== 'Not detected') {
    verificationConfidence += 40; // We had a domain to verify
    if (externalContext.dns?.status !== 'UNAVAILABLE') verificationConfidence += 20;
    if (externalContext.tls?.status !== 'UNAVAILABLE') verificationConfidence += 20;
    if (externalContext.emailAuth?.spfStatus !== 'UNAVAILABLE') verificationConfidence += 20;
  } else {
    verificationConfidence = 20; // Text-only baseline
  }
  verificationConfidence = Math.min(100, verificationConfidence);

  // DIY Step-by-Step Verification Guide (Section 22)
  const diyVerificationSteps: string[] = [
    matchedOrg
      ? `Open your browser and navigate manually to the official website: ${matchedOrg.careersPortal}`
      : `Look up the official public website of "${entities.organization}" using an independent search engine.`,
    'Navigate directly to the official Careers or Jobs tab and search for the requisition title.',
    'Contact the organization talent desk using contact details obtained from the official directory—never use unverified numbers from messages.',
    'If contacted on WhatsApp/Telegram, ask the recruiter to send a verification ping from their official @company.com address.',
    'Never transfer security deposits, laptop fees, or bank OTPs during candidate evaluation.'
  ];

  // Separate Submitted vs External Evidence Items (Section 10 & 11)
  const externalEvidenceItems: ExternalEvidenceItem[] = [
    {
      source: 'User Submission',
      finding: `Submitted role: "${entities.jobTitle}" at claimed organization "${entities.organization}".`,
      badge: 'USER_SUBMITTED'
    },
    {
      source: 'User Submission',
      finding: `Contact handle provided: "${entities.recruiterEmail}" on channel "${entities.communicationPlatform}".`,
      badge: 'USER_SUBMITTED'
    }
  ];

  if (matchedOrg) {
    externalEvidenceItems.push({
      source: `Official Directory (${matchedOrg.officialDomain})`,
      finding: `Authenticated corporate domain identified as "${matchedOrg.officialDomain}".`,
      badge: 'EXTERNAL_SOURCE'
    });
    if (opportunityExistence === 'FOUND_ON_OFFICIAL_SOURCE') {
      externalEvidenceItems.push({
        source: `Official Careers Portal (${matchedOrg.careersPortal})`,
        finding: 'Application pipeline matches authenticated enterprise candidate system.',
        badge: 'EXTERNAL_SOURCE'
      });
    } else {
      externalEvidenceItems.push({
        source: `Official Careers Portal (${matchedOrg.careersPortal})`,
        finding: 'The opportunity could not be automatically located on public listings. Independent inquiry recommended.',
        badge: 'EXTERNAL_SOURCE'
      });
    }
  } else {
    externalEvidenceItems.push({
      source: 'Enterprise Knowledge Index',
      finding: 'Organization is an unindexed startup, boutique agency, or student initiative.',
      badge: 'EXTERNAL_SOURCE'
    });
  }

  return {
    claims,
    evidenceVerificationPercent,
    officialDomain,
    submittedDomain,
    domainStatus,
    websiteAvailability,
    opportunityExistence,
    diyVerificationSteps,
    externalEvidenceItems,
    trustScore,
    trustRationale,
    verificationConfidence,
    externalContext
  };
}
