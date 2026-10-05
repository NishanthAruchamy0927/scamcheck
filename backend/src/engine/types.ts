export type OpportunityType =
  | 'Internship'
  | 'Full-time Job'
  | 'Part-time Job'
  | 'Freelance Project'
  | 'Scholarship / Grant'
  | 'Training / Bootcamp'
  | 'Research Program'
  | 'Unspecified';

export type SignalSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'POSITIVE';

export type SignalCategory =
  | 'FINANCIAL'
  | 'IDENTITY'
  | 'COMMUNICATION'
  | 'PROCEDURE'
  | 'CONSISTENCY'
  | 'PSYCHOLOGICAL'
  | 'TRUST'
  | 'CREDENTIAL'
  | 'URGENCY'
  | 'ORGANIZATION';

export type RiskTier = 'LOW RISK' | 'NEEDS VERIFICATION' | 'HIGH RISK';
export type RiskLevel = 'LOW' | 'NEEDS_VERIFICATION' | 'HIGH';

export type ExposureLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface CategoryRisks {
  financial: number;      // 0 - 100
  identity: number;       // 0 - 100
  communication: number;  // 0 - 100
  urgency: number;        // 0 - 100
  credential: number;     // 0 - 100
  organization: number;   // 0 - 100
}

export interface ExtractedOpportunity {
  title: string;
  jobTitle: string;
  organization: string;
  recruiter: string;
  email: string;
  recruiterEmail: string;
  phone: string;
  phoneNumber: string;
  website: string;
  url: string;
  opportunityUrl: string;
  type: OpportunityType;
  opportunityType: OpportunityType;
  location: string;
  compensation: string;
  salaryStipend: string;
  paymentRequested: boolean;
  paymentAmount: string;
  paymentReason: string;
  paymentPurpose: string;
  deadline: string;
  deadlines: string;
  requestedDocuments: string[];
  requestedCredentials: string[];
  communicationPlatform: string;
  applicationMethod: string;
  claims: string[];
}

export interface ScamSignal {
  id: string;
  signalId: string;
  name: string;
  severity: SignalSeverity;
  category: SignalCategory;
  evidence: string;
  weight: number;
  riskContribution: number;
  explanation: string;
  whyItMatters: string;
  mitigation: string;
}

export interface EvidenceNode {
  id: string;
  finding: string;
  evidenceQuote: string;
  whyItMatters: string;
  riskContribution: number;
  severity: SignalSeverity;
  category: SignalCategory;
}

export interface OrgConsistencyVector {
  orgIdentityStatus: 'VERIFIED' | 'DETECTED' | 'AMBIGUOUS' | 'UNRESOLVED';
  orgIdentityNotes: string;
  officialDomainStatus: 'MATCHED' | 'DETECTED' | 'UNVERIFIED' | 'MISSING';
  officialDomainNotes: string;
  recruiterDomainStatus:
    | 'OFFICIAL_MATCH'
    | 'PUBLIC_FREE_EMAIL'
    | 'DOMAIN_MISMATCH'
    | 'ANONYMOUS_CHANNEL'
    | 'UNSPECIFIED';
  recruiterDomainNotes: string;
  contactPlatformStatus:
    | 'ENTERPRISE_ATS'
    | 'OFFICIAL_EMAIL'
    | 'DIRECT_PHONE'
    | 'UNOFFICIAL_CHAT_APP'
    | 'UNSPECIFIED';
  contactPlatformNotes: string;
  recruitmentWorkflowStatus:
    | 'STANDARD_MULTI_STAGE'
    | 'INFORMAL_DIRECT'
    | 'NO_INTERVIEW_INSTANT_OFFER'
    | 'PAYMENT_GATED'
    | 'UNSPECIFIED';
  recruitmentWorkflowNotes: string;
  overallConsistency: 'STRONG_ALIGNMENT' | 'PARTIAL_INCONSISTENCY' | 'SEVERE_MISMATCH' | 'INSUFFICIENT_DATA';
}

export interface PotentialExposure {
  financial: ExposureLevel;
  financialAmount: string;
  financialLevel: ExposureLevel;
  financialNotes: string;
  credential: ExposureLevel;
  credentialLevel: ExposureLevel;
  credentialNotes: string;
  identity: ExposureLevel;
  identityLevel: ExposureLevel;
  identityNotes: string;
  employment: ExposureLevel;
  employmentLevel: ExposureLevel;
  employmentNotes: string;
  privacy: ExposureLevel;
  privacyLevel: ExposureLevel;
  privacyNotes: string;
}

export interface RecommendedAction {
  primaryVerdict: 'STOP' | 'VERIFY' | 'PROCEED_WITH_CAUTION';
  headline: string;
  actionSteps: string[];
  safetyTips: string[];
  officialVerificationGuide: string[];
}

export interface UncertaintyHandling {
  isAmbiguous: boolean;
  refusalExplanation?: string;
  missingEvidence: string[];
  guidanceToAcquire: string[];
}

export interface InvestigationStep {
  step: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SKIPPED';
  detail: string;
  timestamp: string;
}

// ----------------------------------------------------
// PROMPT 5 DIFFERENTIATION LAYER INTERFACES
// ----------------------------------------------------

export interface OpportunityDna {
  organization: string;
  recruiter: string;
  contact: string;
  domain: string;
  opportunityType: string;
  compensation: string;
  payment: string;
  urgency: string;
  selection: string;
  evidenceCompleteness: number; // 0 - 100%
  consistencyFingerprint: {
    organization: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
    recruiter: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
    contact: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
    payment: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
    process: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
  };
}

export interface TrustProfile {
  identityConsistency: number; // 0 - 100
  contactConsistency: number;  // 0 - 100
  processConsistency: number;  // 0 - 100
  financialSafety: number;     // 0 - 100
  evidenceStrength: number;    // 0 - 100 (separate from legitimacy)
}

export interface Contradiction {
  id: string;
  type: string;
  claimA: string;
  claimB: string;
  explanation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface LegitimacyCheck {
  positiveIndicators: string[];
  rationale: string;
}

export interface ManipulationSignal {
  type: 'URGENCY' | 'SCARCITY' | 'AUTHORITY' | 'SECRECY' | 'GUARANTEE';
  quote: string;
  explanation: string;
}

export interface FalsePositiveContext {
  signalName: string;
  potentialBenignExplanation: string;
  contextualAdvice: string;
}

export interface ScoreWaterfallDriver {
  name: string;
  delta: number;
  category: string;
}

// ----------------------------------------------------
// PROMPT 6 EXTERNAL VERIFICATION INTERFACES
// ----------------------------------------------------

export type VerificationClaimStatus =
  | 'VERIFIED'
  | 'CONSISTENT'
  | 'UNVERIFIED'
  | 'MISMATCH'
  | 'NOT_CHECKED'
  | 'UNAVAILABLE';

export interface VerificationClaim {
  claim: string;
  submitted: string;
  external: string;
  status: VerificationClaimStatus;
  rationale: string;
}

export interface ExternalEvidenceItem {
  source: string;
  finding: string;
  badge: 'EXTERNAL_SOURCE' | 'USER_SUBMITTED';
}

export interface ExternalVerificationContext {
  dns?: {
    status: 'VERIFIED' | 'UNVERIFIED' | 'UNAVAILABLE';
    hasA: boolean;
    hasMx: boolean;
    notes: string[];
  };
  tls?: {
    status: 'VERIFIED' | 'UNVERIFIED' | 'UNAVAILABLE';
    issuer: string | null;
    validFrom: string | null;
    validTo: string | null;
    notes: string[];
  };
  emailAuth?: {
    hasMx: boolean;
    spfStatus: 'SPF_PRESENT' | 'SPF_ABSENT' | 'UNAVAILABLE';
    dmarcStatus: 'DMARC_PRESENT' | 'DMARC_ABSENT' | 'UNAVAILABLE';
    notes: string[];
  };
  rdap?: {
    status: 'AVAILABLE' | 'UNAVAILABLE';
    registrationDate: string | null;
    expirationDate: string | null;
    registrar: string | null;
    notes: string[];
  };
}

export interface VerificationCenterData {
  claims: VerificationClaim[];
  evidenceVerificationPercent: number; // % of claims that could be independently checked
  officialDomain: string;
  submittedDomain: string;
  domainStatus: 'MATCH' | 'MISMATCH' | 'LOOKALIKE' | 'UNVERIFIED';
  websiteAvailability: 'REACHABLE' | 'UNREACHABLE' | 'TIMEOUT' | 'UNAVAILABLE';
  opportunityExistence: 'FOUND_ON_OFFICIAL_SOURCE' | 'NOT_FOUND' | 'SEARCH_UNAVAILABLE' | 'NOT_CHECKED';
  diyVerificationSteps: string[];
  externalEvidenceItems: ExternalEvidenceItem[];
  trustScore: number;
  trustRationale: string;
  verificationConfidence: number;
  externalContext?: ExternalVerificationContext;
}

export interface MachineLearningAnalysis {
  available: boolean;
  model?: string;
  version?: string;
  score?: number;      // e.g., 0-100 ML probability
  confidence?: number; // e.g., 0-100 ML confidence (calibrated)
  reason?: string;
}

// ----------------------------------------------------
// PROMPT 7 MULTIMODAL INTERFACES (Phase 5)
// ----------------------------------------------------
export interface ExtractedEntity {
  type: 'URL' | 'EMAIL' | 'PHONE' | 'DOMAIN' | 'ORGANIZATION' | 'PERSON' | 'CURRENCY' | 'PAYMENT_REQUEST' | 'ACCOUNT_NUMBER' | 'UPI' | 'UPI_URL' | 'QR_PAYLOAD' | 'SOCIAL_MEDIA' | 'OTHER';
  value: string;
  normalizedValue?: string;
  source: 'TEXT' | 'OCR' | 'PDF' | 'DOCX' | 'URL' | 'QR' | 'QR_DECODER' | 'QR_PAYLOAD' | 'UNKNOWN';
  confidence: number;
  metadata?: any;
}

export interface NormalizedInput {
  type: 'TEXT' | 'IMAGE' | 'PDF' | 'DOCX' | 'URL' | 'MIXED';
  sourceId?: string;
  originalName?: string;
}

export interface MultimodalContent {
  inputs: NormalizedInput[];
  content: {
    text: string;
    entities: ExtractedEntity[];
  };
  metadata: {
    ocrUsed: boolean;
    pageCount?: number;
    fileHashes?: string[];
    [key: string]: any;
  };
}

export interface InvestigationReport {
  id: string;
  timestamp: string;
  inputSnippet: string;
  inputMode: 'text' | 'document' | 'image' | 'url';
  riskScore: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  riskTier: RiskTier;
  confidenceRationale: string;
  summary: string;
  executiveAssessment: string;
  recommendation: string;
  categoryRisks: CategoryRisks;
  opportunity: ExtractedOpportunity;
  extractedOpportunity: ExtractedOpportunity;
  signals: ScamSignal[];
  evidence: EvidenceNode[];
  evidenceChain: EvidenceNode[];
  orgConsistency: OrgConsistencyVector;
  potentialExposure: PotentialExposure;
  recommendedAction: RecommendedAction;
  uncertainty: UncertaintyHandling;
  limitations: string[];
  investigationSteps: InvestigationStep[];
  disclaimer: string;

  // Differentiation Features (Prompt 5)
  opportunityDna?: OpportunityDna;
  trustProfile?: TrustProfile;
  contradictions?: Contradiction[];
  legitimacyCheck?: LegitimacyCheck;
  manipulationSignals?: ManipulationSignal[];
  falsePositiveContext?: FalsePositiveContext[];
  scoreDrivers?: ScoreWaterfallDriver[];

  // External Verification Center (Prompt 6)
  verificationCenter?: VerificationCenterData;

  // ML Analysis (Phase 4)
  machineLearning?: MachineLearningAnalysis;

  // Multimodal Context (Phase 5)
  multimodal?: MultimodalContent;

  // Company credibility (LinkedIn footprint) & student career value
  companyCredibility?: CompanyCredibilityReport;
}

export interface ComparisonReport {
  id: string;
  timestamp: string;
  itemA: InvestigationReport;
  itemB: InvestigationReport;
  deltaSummary: {
    riskDelta: number;
    saferOption: 'A' | 'B' | 'EQUAL';
    keyDifferences: string[];
    recommendation: string;
  };
}

// ----------------------------------------------------
// Company Credibility & Career Value (LinkedIn footprint)
// ----------------------------------------------------

/** Facts a student can read off a company's public LinkedIn page (all optional). */
export interface LinkedInCompanyFacts {
  followers?: number;
  employeesOnLinkedIn?: number;
  foundedYear?: number;
  website?: string;
  /** Do past interns go on to work at reputable companies? */
  internsPlacedAtGoodCompanies?: 'yes' | 'no' | 'unknown';
  /** Is the company feed mostly interns posting certificates/offer letters? */
  postsMostlyCertificates?: boolean;
}

export type LinkedInLookupStatus =
  | 'NOT_PROVIDED'
  | 'INVALID_URL'
  | 'PERSONAL_PROFILE'
  | 'FETCHED'
  | 'BLOCKED_OR_UNREACHABLE';

export interface LinkedInProfileAnalysis {
  url: string | null;
  slug: string | null;
  status: LinkedInLookupStatus;
  statusDetail: string;
  pageTitle: string | null;
  /** Merged view: auto-fetched values, overridden by anything the student entered. */
  facts: LinkedInCompanyFacts & { companySize?: string; industry?: string };
  factSources: Partial<Record<keyof LinkedInCompanyFacts | 'companySize' | 'industry', 'LINKEDIN_PUBLIC_PAGE' | 'USER_PROVIDED'>>;
}

export interface CredibilityFactor {
  label: string;
  impact: number;
  detail: string;
}

export type CompanyCredibilityVerdict = 'REPUTABLE' | 'CREDIBLE' | 'UNPROVEN' | 'RED_FLAGS';
export type CareerValueVerdict = 'HIGH_VALUE' | 'MODERATE_VALUE' | 'LOW_VALUE' | 'AVOID' | 'NOT_ENOUGH_INFO';
export type ProgramModel =
  | 'PAID_STIPEND_ROLE'
  | 'UNPAID_ROLE'
  | 'PAY_FOR_CERTIFICATE'
  | 'PAID_TRAINING_PROGRAM'
  | 'FEE_FOR_ROLE'
  | 'UNCLEAR';

export interface CareerValueAssessment {
  programModel: ProgramModel;
  programModelLabel: string;
  score: number;
  verdict: CareerValueVerdict;
  headline: string;
  explanation: string;
  positives: CredibilityFactor[];
  concerns: CredibilityFactor[];
  makeItWorthwhile: string[];
  betterAlternatives: string[];
}

export interface CompanyCredibilityReport {
  companyName: string;
  isKnownEnterprise: boolean;
  credibilityScore: number;
  verdict: CompanyCredibilityVerdict;
  /** How much evidence the score rests on (LinkedIn data, known registry, etc.). */
  evidenceLevel: 'STRONG' | 'PARTIAL' | 'MINIMAL';
  summary: string;
  factors: CredibilityFactor[];
  linkedin: LinkedInProfileAnalysis;
  careerValue: CareerValueAssessment;
  /** Manual steps to complete the check on LinkedIn (which blocks automated reads). */
  linkedinChecklist: string[];
  disclaimer: string;
}
