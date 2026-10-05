import {
  CareerValueAssessment,
  CareerValueVerdict,
  CompanyCredibilityReport,
  CompanyCredibilityVerdict,
  CredibilityFactor,
  ExtractedOpportunity,
  LinkedInCompanyFacts,
  LinkedInProfileAnalysis,
  ProgramModel,
  RiskTier
} from './types.js';
import { KNOWN_ENTERPRISES, FREE_PUBLIC_EMAIL_DOMAINS, VerifiedOrganization } from './knownDatabases.js';
import { safeNetworkFetch } from './network/safeNetworkClient.js';

const LINKEDIN_URL_REGEX =
  /https?:\/\/(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/(?:company|school|showcase|in)\/[A-Za-z0-9\-_%.]+\/?/i;

export interface CompanyCredibilityInput {
  text: string;
  entities: ExtractedOpportunity;
  riskTier?: RiskTier;
  companyName?: string;
  linkedinUrl?: string;
  linkedinFacts?: LinkedInCompanyFacts;
  /** Disable network access (tests / offline). Defaults to true. */
  fetchLinkedIn?: boolean;
}

export function findLinkedInUrl(text: string): string | null {
  const match = text.match(LINKEDIN_URL_REGEX);
  return match ? match[0] : null;
}

/** Parses LinkedIn-style counts such as "12,345", "1.2K" or "3M". */
export function parseCount(raw: string): number | undefined {
  const m = raw.trim().replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*([KkMm])?/);
  if (!m) return undefined;
  const base = parseFloat(m[1]);
  const mult = m[2] ? (m[2].toLowerCase() === 'k' ? 1_000 : 1_000_000) : 1;
  return Math.round(base * mult);
}

function normalizeHost(value: string): string | null {
  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function tokens(name: string): Set<string> {
  const stop = new Set(['pvt', 'ltd', 'private', 'limited', 'inc', 'llc', 'llp', 'the', 'and', 'co', 'corp', 'company', 'india', 'technologies', 'technology', 'solutions', 'services']);
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !stop.has(t))
  );
}

function namesMatch(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return true; // nothing distinctive to compare
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

// Matches on the resolved company name only: the entity extractor already skips
// tool mentions such as "Google Form", which a full-text match would not.
function findKnownEnterprise(name: string): VerifiedOrganization | undefined {
  return KNOWN_ENTERPRISES.find((ent) =>
    [ent.name, ...ent.aliases].some((alias) =>
      new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(name)
    )
  );
}

/** Extracts what LinkedIn exposes on its public (logged-out) company page. */
export function parseLinkedInCompanyHtml(html: string): {
  pageTitle: string | null;
  facts: LinkedInCompanyFacts & { companySize?: string; industry?: string };
} {
  const meta = (prop: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))?.[1] ??
    null;

  const rawTitle = meta('og:title') || html.match(/<title>([^<]*)<\/title>/i)?.[1] || null;
  const pageTitle = rawTitle ? rawTitle.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim() || null : null;

  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  const description = meta('og:description') || meta('description') || '';
  const haystack = `${description} ${text}`;

  const facts: LinkedInCompanyFacts & { companySize?: string; industry?: string } = {};

  const followers = haystack.match(/([\d.,]+\s*[KkMm]?)\s+followers/);
  if (followers) facts.followers = parseCount(followers[1]);

  const employees =
    haystack.match(/View all ([\d,]+) employees/i) ||
    haystack.match(/([\d,]+) (?:employees|associated members) on LinkedIn/i);
  if (employees) facts.employeesOnLinkedIn = parseCount(employees[1]);

  const size = haystack.match(/Company size\s+([\d,]+(?:\s*-\s*[\d,]+)?\+?)\s+employees/i);
  if (size) facts.companySize = `${size[1].replace(/\s+/g, '')} employees`;

  const founded = haystack.match(/Founded\s+((?:19|20)\d{2})/i);
  if (founded) facts.foundedYear = parseInt(founded[1], 10);

  const industry = haystack.match(/Industr(?:y|ies)\s+([A-Za-z&,' -]{3,60}?)\s+(?:Company size|Headquarters|Type|Founded|Specialties)/i);
  if (industry) facts.industry = industry[1].trim();

  const website = haystack.match(/Website\s+(https?:\/\/[^\s"']+)/i);
  if (website) facts.website = website[1];

  return { pageTitle, facts };
}

async function analyzeLinkedIn(
  url: string | null,
  userFacts: LinkedInCompanyFacts,
  fetchEnabled: boolean
): Promise<LinkedInProfileAnalysis> {
  const analysis: LinkedInProfileAnalysis = {
    url,
    slug: null,
    status: 'NOT_PROVIDED',
    statusDetail: 'No LinkedIn company page was provided.',
    pageTitle: null,
    facts: {},
    factSources: {}
  };

  if (url) {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      parsed = null;
    }
    const host = parsed?.hostname.toLowerCase() ?? '';
    const pathMatch = parsed?.pathname.match(/^\/(company|school|showcase|in)\/([^/]+)/i);

    if (!parsed || !(host === 'linkedin.com' || host.endsWith('.linkedin.com')) || !pathMatch) {
      analysis.status = 'INVALID_URL';
      analysis.statusDetail = 'This is not a LinkedIn company page URL (expected linkedin.com/company/<name>).';
    } else if (pathMatch[1].toLowerCase() === 'in') {
      analysis.slug = pathMatch[2];
      analysis.status = 'PERSONAL_PROFILE';
      analysis.statusDetail =
        'This is a personal profile, not a company page. A recruiter profile alone does not prove the company exists — ask for the company page.';
    } else {
      analysis.slug = decodeURIComponent(pathMatch[2]);
      analysis.status = 'BLOCKED_OR_UNREACHABLE';
      analysis.statusDetail =
        'LinkedIn blocks most automated reads. Enter the numbers shown on the company page below for a complete check.';

      if (fetchEnabled) {
        try {
          const pageUrl = `https://www.linkedin.com/${pathMatch[1].toLowerCase()}/${pathMatch[2]}/`;
          const response = await safeNetworkFetch(pageUrl, {
            timeoutMs: 6000,
            maxResponseBytes: 1024 * 1024,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScamCheck-Company-Verifier/1.0)', 'Accept-Language': 'en' }
          });
          const blocked = response.statusCode !== 200 || /authwall|login|checkpoint/i.test(new URL(response.url).pathname);
          if (!blocked) {
            const { pageTitle, facts } = parseLinkedInCompanyHtml(response.data);
            analysis.pageTitle = pageTitle;
            for (const [key, value] of Object.entries(facts)) {
              if (value !== undefined) {
                (analysis.facts as any)[key] = value;
                (analysis.factSources as any)[key] = 'LINKEDIN_PUBLIC_PAGE';
              }
            }
            if (pageTitle || Object.keys(facts).length > 0) {
              analysis.status = 'FETCHED';
              analysis.statusDetail = 'Read the public LinkedIn company page.';
            }
          }
        } catch {
          // Network failure: keep BLOCKED_OR_UNREACHABLE and rely on user-provided facts
        }
      }
    }
  }

  // Values the student read off the page take precedence over auto-extracted ones
  for (const [key, value] of Object.entries(userFacts)) {
    if (value !== undefined && value !== null && value !== '') {
      (analysis.facts as any)[key] = value;
      (analysis.factSources as any)[key] = 'USER_PROVIDED';
    }
  }

  return analysis;
}

function sanitizeFacts(raw: any): LinkedInCompanyFacts {
  if (!raw || typeof raw !== 'object') return {};
  const num = (v: any, max: number) => {
    const n = typeof v === 'string' ? parseCount(v) : typeof v === 'number' ? v : undefined;
    return n !== undefined && Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : undefined;
  };
  const year = num(raw.foundedYear, new Date().getFullYear());
  return {
    followers: num(raw.followers, 1e9),
    employeesOnLinkedIn: num(raw.employeesOnLinkedIn, 1e7),
    foundedYear: year !== undefined && year >= 1800 ? year : undefined,
    website: typeof raw.website === 'string' && raw.website.trim() ? raw.website.trim().slice(0, 200) : undefined,
    internsPlacedAtGoodCompanies: ['yes', 'no', 'unknown'].includes(raw.internsPlacedAtGoodCompanies)
      ? raw.internsPlacedAtGoodCompanies
      : undefined,
    postsMostlyCertificates: typeof raw.postsMostlyCertificates === 'boolean' ? raw.postsMostlyCertificates : undefined
  };
}

function scoreCompany(
  companyName: string,
  known: VerifiedOrganization | undefined,
  linkedin: LinkedInProfileAnalysis,
  entities: ExtractedOpportunity,
  riskTier?: RiskTier
): { score: number; factors: CredibilityFactor[] } {
  const factors: CredibilityFactor[] = [];
  const add = (label: string, impact: number, detail: string) => factors.push({ label, impact, detail });
  const f = linkedin.facts;
  let score = 40;

  if (known) {
    add('Recognised enterprise', 45, `${known.name} is a well-known employer with a public zero-fee hiring policy.`);
  }

  if (linkedin.status === 'PERSONAL_PROFILE') {
    add('Only a personal LinkedIn profile', -5, 'A recruiter profile does not verify the company; ask for the official company page.');
  } else if (linkedin.status === 'INVALID_URL') {
    add('LinkedIn link is not a company page', -5, linkedin.statusDetail);
  }

  if (f.followers !== undefined) {
    if (f.followers >= 100_000) add('Large LinkedIn following', 20, `${f.followers.toLocaleString('en-IN')} followers.`);
    else if (f.followers >= 10_000) add('Established LinkedIn following', 12, `${f.followers.toLocaleString('en-IN')} followers.`);
    else if (f.followers >= 1_000) add('Moderate LinkedIn following', 6, `${f.followers.toLocaleString('en-IN')} followers.`);
    else if (f.followers < 200) add('Very small LinkedIn following', -10, `Only ${f.followers} followers — little public footprint.`);
  }

  if (f.employeesOnLinkedIn !== undefined) {
    const e = f.employeesOnLinkedIn;
    if (e >= 500) add('Large verifiable workforce', 18, `${e.toLocaleString('en-IN')} people list this company on LinkedIn.`);
    else if (e >= 50) add('Real team on LinkedIn', 10, `${e} people list this company as their employer.`);
    else if (e >= 10) add('Small team on LinkedIn', 3, `${e} people list this company as their employer.`);
    else add('Almost no employees on LinkedIn', -12, `Only ${e} people list this company — hard to verify a real team exists.`);

    if (f.followers !== undefined && f.followers >= 5_000 && e < 25) {
      add(
        'Followers far exceed employees',
        -12,
        `${f.followers.toLocaleString('en-IN')} followers but only ${e} employees. Certificate-selling "internship" companies often grow followers through interns sharing certificates.`
      );
    }
  }

  if (f.foundedYear !== undefined) {
    const age = new Date().getFullYear() - f.foundedYear;
    if (age >= 5) add('Operating for several years', 8, `Founded ${f.foundedYear} (${age} years).`);
    else if (age >= 2) add('Young company', 2, `Founded ${f.foundedYear}.`);
    else add('Very new company', -8, `Founded ${f.foundedYear} — under two years of track record.`);
  }

  if (f.postsMostlyCertificates === true) {
    add(
      'Feed is mostly certificate posts',
      -15,
      'When most company posts are interns showing off certificates or offer letters, the certificate is usually the product being sold.'
    );
  }

  if (f.internsPlacedAtGoodCompanies === 'yes') {
    add('Past interns moved on to good companies', 15, 'Strong evidence the experience is valued by employers.');
  } else if (f.internsPlacedAtGoodCompanies === 'no') {
    add('No evidence past interns progressed', -10, 'Past interns do not appear to have moved on to reputable employers.');
  }

  // Cross-check the LinkedIn website against the domain used in the offer
  const linkedinHost = f.website ? normalizeHost(f.website) : null;
  const emailDomain = entities.recruiterEmail !== 'Not detected' ? entities.recruiterEmail.split('@')[1]?.toLowerCase() : undefined;
  const offerHosts = [
    entities.website !== 'Not detected' ? normalizeHost(entities.website) : null,
    emailDomain && !FREE_PUBLIC_EMAIL_DOMAINS.has(emailDomain) ? emailDomain : null
  ].filter((h): h is string => !!h && !h.endsWith('linkedin.com'));
  if (linkedinHost && offerHosts.length > 0) {
    const matches = offerHosts.some((h) => h === linkedinHost || h.endsWith(`.${linkedinHost}`) || linkedinHost.endsWith(`.${h}`));
    if (matches) add('Website matches the offer', 8, `LinkedIn lists ${linkedinHost}, the same domain used in the offer.`);
    else add('Website does not match the offer', -12, `LinkedIn lists ${linkedinHost}, but the offer uses ${offerHosts.join(', ')}.`);
  }

  if (linkedin.pageTitle && companyName && companyName !== 'Not detected' && !namesMatch(linkedin.pageTitle, companyName)) {
    add('LinkedIn page name differs', -10, `The page is "${linkedin.pageTitle}", but the offer names "${companyName}".`);
  }

  if (emailDomain && FREE_PUBLIC_EMAIL_DOMAINS.has(emailDomain) && !known) {
    add('Recruiter uses a free email address', -5, `${entities.recruiterEmail} is not on a company domain.`);
  }

  if (riskTier === 'HIGH RISK') {
    add('Scam indicators in the offer', -25, 'The offer itself triggered high-risk fraud signals.');
  } else if (entities.paymentRequested) {
    add('Candidate is asked to pay', -8, 'Reputable employers do not charge students to join.');
  }

  for (const factor of factors) score += factor.impact;
  return { score: Math.max(0, Math.min(100, Math.round(score))), factors };
}

function assessCareerValue(
  text: string,
  entities: ExtractedOpportunity,
  known: VerifiedOrganization | undefined,
  companyScore: number,
  linkedin: LinkedInProfileAnalysis,
  riskTier?: RiskTier
): CareerValueAssessment {
  const t = text;
  const positives: CredibilityFactor[] = [];
  const concerns: CredibilityFactor[] = [];
  const pos = (label: string, impact: number, detail: string) => positives.push({ label, impact, detail });
  const con = (label: string, impact: number, detail: string) => concerns.push({ label, impact: -Math.abs(impact), detail });

  const mentionsCertificate = /certificat/i.test(t);
  const mentionsTraining = /\b(training|course|bootcamp|classes|lectures?|recorded|self[- ]paced|modules?|syllabus|curriculum)\b/i.test(t);
  const feeDemanded =
    entities.paymentRequested ||
    /\b(?:registration|enrol?ment|certificat(?:e|ion)|program(?:me)?|training|course|joining|processing|kit)\s+(?:fee|fees|charges?|cost)\b/i.test(t) ||
    /\bpay(?:ing|ment)?\b[^.\n]{0,40}\bfor\s+(?:the\s+|your\s+)?certificate/i.test(t);
  const isUnpaid = /\b(unpaid|no stipend|without stipend|stipend:?\s*(?:nil|none|0)\b)/i.test(t);
  const hasStipend = !isUnpaid && entities.salaryStipend !== 'Not detected';

  let programModel: ProgramModel = 'UNCLEAR';
  if (feeDemanded) {
    if (mentionsTraining) programModel = 'PAID_TRAINING_PROGRAM';
    else if (mentionsCertificate) programModel = 'PAY_FOR_CERTIFICATE';
    else programModel = 'FEE_FOR_ROLE';
  } else if (hasStipend) programModel = 'PAID_STIPEND_ROLE';
  else if (isUnpaid) programModel = 'UNPAID_ROLE';

  const labels: Record<ProgramModel, string> = {
    PAID_STIPEND_ROLE: 'Paid internship / job (company pays you)',
    UNPAID_ROLE: 'Unpaid internship',
    PAY_FOR_CERTIFICATE: 'Pay-for-certificate "internship"',
    PAID_TRAINING_PROGRAM: 'Paid training / course marketed as an internship',
    FEE_FOR_ROLE: 'Upfront fee to get the role',
    UNCLEAR: 'Payment terms not stated'
  };

  // --- Model ---
  if (programModel === 'PAID_STIPEND_ROLE') pos('Pays a stipend', 15, `Stipend: ${entities.salaryStipend}. The company is investing in your work, which employers recognise.`);
  if (programModel === 'PAY_FOR_CERTIFICATE')
    con('You pay to get a certificate', 35, 'Recruiters at strong companies do not count a purchased certificate as work experience.');
  if (programModel === 'PAID_TRAINING_PROGRAM')
    con('It is a paid course, not a job', 18, 'The value depends entirely on the teaching quality — the "internship" label adds little on a résumé.');
  if (programModel === 'FEE_FOR_ROLE') con('Fee demanded to join', 40, 'Legitimate employers never charge candidates to be hired.');

  // --- Positive signals ---
  const noInterview = /\b(no interview|without (?:any )?interview|direct(?:ly)? selected|guaranteed selection|everyone (?:is )?selected|no test)\b/i.test(t);
  if (/\b(?:live|real[- ]world|real|client|production|industry)\s+projects?\b/i.test(t))
    pos('Real project work', 12, 'Mentions live or client projects — something concrete to show recruiters.');
  if (/\bmentor(?:ship|ed|s)?\b|\b1:1\b|one[- ]on[- ]one|code reviews?/i.test(t))
    pos('Mentorship', 8, 'Guidance from experienced engineers is what makes an internship valuable.');
  if (!noInterview && /\b(interviews?|assessment|coding (?:test|round|challenge)|technical round|screening)\b/i.test(t))
    pos('Selective process', 10, 'Interviews or assessments mean the role is competitive, which employers respect.');
  if (/\b(ppo|pre[- ]placement offer|full[- ]time (?:offer|conversion|role))\b/i.test(t))
    pos('Path to a full-time offer', 10, 'A pre-placement offer is a strong career outcome.');
  if (/\b(github|portfolio|open[- ]source|deploy(?:ed|ment)?)\b/i.test(t))
    pos('Public, verifiable output', 5, 'Work you can link to (GitHub, deployed apps) outweighs any certificate.');
  if (known) pos('Recognised employer', 20, `${known.name} on a résumé carries real weight with recruiters.`);
  if (companyScore >= 75 && !known) pos('Credible company footprint', 10, 'The company has a solid, verifiable presence.');
  if (linkedin.facts.internsPlacedAtGoodCompanies === 'yes')
    pos('Alumni moved on to good companies', 15, 'The best evidence this experience helps students get hired.');

  // --- Concerns ---
  if (noInterview) con('No selection process', 10, 'If everyone is selected, the experience signals nothing to employers.');
  if (/\b100\s?%\s*(?:placement|job)|(?:placement|job)\s+guarantee/i.test(t))
    con('Placement guarantee', 12, 'Nobody can guarantee a job; this is a sales tactic.');
  if (/\b(recorded (?:videos?|sessions?|lectures?)|self[- ]paced|pre[- ]recorded)\b/i.test(t))
    con('Recorded / self-paced content', 8, 'Watching videos is a course, not an internship; there is no team or real work.');
  if (/\b(limited seats|seats? (?:left|remaining)|enrol+ now|batch (?:starts|starting)|hurry)\b/i.test(t))
    con('Sales-style urgency', 5, 'Batches, seats and "enroll now" are course-marketing language, not hiring language.');
  if (/\b(AICTE|MSME|ISO|govt\.?|government)[- ]?(?:approved|certified|recogni[sz]ed|registered)/i.test(t))
    con(
      'Accreditation used as a selling point',
      5,
      'MSME/ISO registration says nothing about training quality, and AICTE approval claims are rarely verifiable. Certificate sellers use these logos to look official.'
    );
  if (/\b(share|post) (?:your |the )?(?:certificate|offer letter)|post (?:it )?on linkedin|tag us\b/i.test(t))
    con('Asks you to post on LinkedIn', 4, 'Students posting certificates is free marketing for the company.');
  if (/\bcomplete\s+\d+\s+tasks\b|\btask[- ]based\b/i.test(t))
    con('Task-checklist "internship"', 6, 'Completing a fixed task list alone, with no team, is not workplace experience.');
  if (linkedin.facts.postsMostlyCertificates === true)
    con('Company feed is certificate posts', 10, 'Suggests the company mainly sells certificates.');
  if (linkedin.facts.internsPlacedAtGoodCompanies === 'no')
    con('Past interns did not progress', 10, 'No sign that this experience helped earlier students.');
  if (companyScore < 35) con('Weak company credibility', 15, 'The company itself could not be verified as reputable.');

  let score = 50;
  for (const p of positives) score += p.impact;
  for (const c of concerns) score += c.impact;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const credentialHarvest = entities.requestedCredentials.length > 0;
  let verdict: CareerValueVerdict;
  if (riskTier === 'HIGH RISK' || programModel === 'FEE_FOR_ROLE' || credentialHarvest) {
    verdict = 'AVOID';
    score = Math.min(score, 15);
  } else if (score >= 70) verdict = 'HIGH_VALUE';
  else if (score >= 50) verdict = 'MODERATE_VALUE';
  else if (score >= 30) verdict = 'LOW_VALUE';
  else verdict = 'AVOID';

  // Nothing to go on: do not imply value either way
  if (verdict !== 'AVOID' && programModel === 'UNCLEAR' && positives.length === 0 && concerns.length === 0) {
    verdict = 'NOT_ENOUGH_INFO';
  }

  // A paid certificate can never be "high value" on its own merits, and neither
  // can an offer from a company we could not verify
  if (
    verdict === 'HIGH_VALUE' &&
    (programModel === 'PAY_FOR_CERTIFICATE' || programModel === 'PAID_TRAINING_PROGRAM' || (!known && companyScore < 55))
  ) {
    verdict = 'MODERATE_VALUE';
    score = Math.min(score, 69);
  }

  let headline: string;
  let explanation: string;
  switch (verdict) {
    case 'AVOID':
      headline = 'Not worth it — this will not help you get into a good company.';
      explanation =
        riskTier === 'HIGH RISK' || programModel === 'FEE_FOR_ROLE' || credentialHarvest
          ? 'The offer shows scam indicators. Do not pay or share personal documents.'
          : 'There is little real work, selection or verifiable outcome here. Your time and money are better spent on projects and recognised programs.';
      break;
    case 'LOW_VALUE':
      headline =
        programModel === 'PAY_FOR_CERTIFICATE'
          ? 'You would be buying a certificate, not gaining experience.'
          : 'Low career value — unlikely to impress recruiters at good companies.';
      explanation =
        'Hiring teams at strong companies look for skills they can verify: projects you built, code they can read, and roles you were selected and paid for. A certificate from a little-known company is not counted as work experience, and recruiters recognise certificate-mill names. If you still join, treat it as a course and only if the teaching is good and you leave with a real project.';
      break;
    case 'NOT_ENOUGH_INFO':
      headline = 'Not enough information to judge career value yet.';
      explanation =
        'Paste the offer text (stipend, selection process, fees, what you will work on) and the LinkedIn details so we can tell whether this will help you get into a good company.';
      break;
    case 'MODERATE_VALUE':
      headline = 'Some value, if you get real work out of it.';
      explanation =
        programModel === 'PAY_FOR_CERTIFICATE' || programModel === 'PAID_TRAINING_PROGRAM'
          ? 'Paying for learning is not automatically bad — NPTEL or university courses are paid too. What matters is who issues the certificate and what you can show afterwards. Confirm the points below before paying.'
          : 'This can help your résumé if the work is real. Make sure you leave with something verifiable — a project, a reference, or a recommendation from a named mentor.';
      break;
    default:
      headline = 'Valuable — this kind of experience helps students get hired.';
      explanation = 'Selective, paid or mentored work at a credible company is exactly what recruiters look for. Make the most of it by building something you can show.';
  }

  const makeItWorthwhile: string[] = [];
  if (verdict !== 'HIGH_VALUE') {
    makeItWorthwhile.push('Ask for a written project scope and confirm you will build something you can show publicly (GitHub repo, deployed app).');
    makeItWorthwhile.push('Ask who your mentor will be and check their LinkedIn — they should have real industry experience.');
    makeItWorthwhile.push('Ask for 2–3 past interns and look them up on LinkedIn: where do they work now?');
    if (mentionsCertificate) makeItWorthwhile.push("Check the certificate has a unique ID that can be verified on the company's own website.");
    if (feeDemanded) makeItWorthwhile.push('Never pay before you have the syllabus, refund policy and company registration (CIN/GST) in writing.');
  } else {
    makeItWorthwhile.push('Keep a log of what you build and ship — you will need concrete examples in later interviews.');
    makeItWorthwhile.push('Ask your manager or mentor for a LinkedIn recommendation before you finish.');
  }

  const betterAlternatives =
    verdict === 'HIGH_VALUE'
      ? []
      : [
          'Recognised certificates at low or no cost: NPTEL (IITs/IISc), university courses on Coursera/edX, or cloud vendor certifications (AWS, Google Cloud, Microsoft).',
          'Open-source programs recruiters respect: Google Summer of Code, LFX Mentorship, GirlScript Summer of Code, Hacktoberfest.',
          'Stipend-paying internships from company careers pages, the AICTE internship portal, or your college placement cell.',
          'Two or three solid projects on GitHub plus hackathons — recruiters weigh these more than any certificate.'
        ];

  return {
    programModel,
    programModelLabel: labels[programModel],
    score,
    verdict,
    headline,
    explanation,
    positives,
    concerns,
    makeItWorthwhile,
    betterAlternatives
  };
}

export async function evaluateCompanyCredibility(input: CompanyCredibilityInput): Promise<CompanyCredibilityReport> {
  const { text, entities, riskTier } = input;
  const userFacts = sanitizeFacts(input.linkedinFacts);
  const linkedinUrl = input.linkedinUrl?.trim() || findLinkedInUrl(text);

  const linkedin = await analyzeLinkedIn(linkedinUrl, userFacts, input.fetchLinkedIn !== false);

  const companyName =
    input.companyName?.trim() ||
    (entities.organization !== 'Not detected' ? entities.organization : '') ||
    linkedin.pageTitle ||
    // A personal profile's slug is a person's name, never the company's
    (linkedin.slug && linkedin.status !== 'PERSONAL_PROFILE' ? linkedin.slug.replace(/[-_]+/g, ' ') : '') ||
    'Unknown company';

  const known = findKnownEnterprise(companyName);
  const { score, factors } = scoreCompany(companyName, known, linkedin, entities, riskTier);

  const factCount = Object.values(linkedin.facts).filter((v) => v !== undefined).length;
  const evidenceLevel: CompanyCredibilityReport['evidenceLevel'] = known || factCount >= 3 ? 'STRONG' : factCount >= 1 ? 'PARTIAL' : 'MINIMAL';

  let verdict: CompanyCredibilityVerdict = score >= 75 ? 'REPUTABLE' : score >= 55 ? 'CREDIBLE' : score >= 35 ? 'UNPROVEN' : 'RED_FLAGS';
  // Without evidence we cannot call an unknown company credible
  if (evidenceLevel === 'MINIMAL' && (verdict === 'REPUTABLE' || verdict === 'CREDIBLE')) verdict = 'UNPROVEN';

  const verdictText: Record<CompanyCredibilityVerdict, string> = {
    REPUTABLE: 'appears to be a reputable, well-established company',
    CREDIBLE: 'has a credible, verifiable presence',
    UNPROVEN: 'could not be verified as reputable yet',
    RED_FLAGS: 'shows red flags that suggest it is not a trustworthy employer'
  };
  const summary =
    `${companyName} ${verdictText[verdict]}.` +
    (evidenceLevel === 'MINIMAL'
      ? ' Add the company LinkedIn page details for a stronger check.'
      : evidenceLevel === 'PARTIAL'
        ? ' Some LinkedIn details are missing; filling them in will sharpen the result.'
        : '');

  const searchName = companyName !== 'Unknown company' ? companyName : 'the company';
  const linkedinChecklist = [
    'Compare followers with the number of employees. Thousands of followers but fewer than ~20 employees is a common certificate-seller pattern.',
    `Open the "People" tab of ${searchName}: real employees have full work histories, not just "Intern at ${searchName}".`,
    `Search "${searchName} intern" on LinkedIn and check where past interns work now — the best evidence of career value.`,
    'Scroll the posts: if most are interns showing certificates or offer letters, the certificate is the product.',
    'Check that the website on the LinkedIn page matches the domain in the offer email.',
    'Check the founded year, and look up company registration (India: MCA company master data) and reviews on Glassdoor/AmbitionBox.'
  ];

  return {
    companyName,
    isKnownEnterprise: !!known,
    credibilityScore: score,
    verdict,
    evidenceLevel,
    summary,
    factors,
    linkedin,
    careerValue: assessCareerValue(text, entities, known, score, linkedin, riskTier),
    linkedinChecklist,
    disclaimer:
      'Signals are based on public LinkedIn data and the offer text. A small or new company can still be a good place to learn — use this as a guide alongside your own checks.'
  };
}
