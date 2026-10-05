export interface VerifiedOrganization {
  name: string;
  aliases: string[];
  officialDomains: string[];
  careersDomains: string[];
  standardHiringProcess: string;
  zeroFeePolicy: boolean;
}

export const KNOWN_ENTERPRISES: VerifiedOrganization[] = [
  {
    name: 'Google',
    aliases: ['Google LLC', 'Alphabet', 'Google India', 'Google Cloud'],
    officialDomains: ['google.com', 'alphabet.com'],
    careersDomains: ['careers.google.com', 'google.com/about/careers'],
    standardHiringProcess: 'Multi-round technical and behavioural interviews, official recruiter @google.com',
    zeroFeePolicy: true
  },
  {
    name: 'Microsoft',
    aliases: ['Microsoft Corporation', 'Microsoft India', 'MSFT'],
    officialDomains: ['microsoft.com'],
    careersDomains: ['careers.microsoft.com'],
    standardHiringProcess: 'Formal application via careers.microsoft.com, online assessments, technical rounds',
    zeroFeePolicy: true
  },
  {
    name: 'Amazon',
    aliases: ['Amazon.com', 'AWS', 'Amazon Development Centre', 'Amazon India'],
    officialDomains: ['amazon.com', 'amazon.jobs', 'amazon.in'],
    careersDomains: ['amazon.jobs'],
    standardHiringProcess: 'Application via amazon.jobs, online assessments, multiple technical/loop interviews',
    zeroFeePolicy: true
  },
  {
    name: 'Tata Consultancy Services',
    aliases: ['TCS', 'Tata Consultancy', 'TCS iON', 'TCS NextStep'],
    officialDomains: ['tcs.com', 'nextstep.tcs.com', 'tcsion.com'],
    careersDomains: ['tcs.com/careers', 'nextstep.tcs.com'],
    standardHiringProcess: 'National Qualifier Test (NQT) / NextStep portal registration, technical + HR interviews. TCS NEVER charges fees.',
    zeroFeePolicy: true
  },
  {
    name: 'Infosys',
    aliases: ['Infosys Limited', 'Infosys BPM', 'Infy'],
    officialDomains: ['infosys.com'],
    careersDomains: ['infosys.com/careers', 'career.infosys.com'],
    standardHiringProcess: 'InfyTQ / HackWithInfy / formal portal application, formal interview panel.',
    zeroFeePolicy: true
  },
  {
    name: 'Wipro',
    aliases: ['Wipro Limited', 'Wipro Technologies'],
    officialDomains: ['wipro.com'],
    careersDomains: ['careers.wipro.com'],
    standardHiringProcess: 'Elite NLTH assessment, technical + HR interview via official portal.',
    zeroFeePolicy: true
  },
  {
    name: 'Accenture',
    aliases: ['Accenture Solutions', 'Accenture India'],
    officialDomains: ['accenture.com'],
    careersDomains: ['accenture.com/careers'],
    standardHiringProcess: 'Cognitive and technical assessment, communication test, interview via portal.',
    zeroFeePolicy: true
  },
  {
    name: 'Meta',
    aliases: ['Meta Platforms', 'Facebook', 'Instagram'],
    officialDomains: ['meta.com', 'facebook.com', 'instagram.com'],
    careersDomains: ['metacareers.com'],
    standardHiringProcess: 'Formal portal application, recruiter screening, coding & architecture interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Apple',
    aliases: ['Apple Inc.', 'Apple India'],
    officialDomains: ['apple.com'],
    careersDomains: ['jobs.apple.com'],
    standardHiringProcess: 'Application via jobs.apple.com, multiple technical and manager interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Deloitte',
    aliases: ['Deloitte Touche Tohmatsu', 'Deloitte USI', 'Deloitte India'],
    officialDomains: ['deloitte.com'],
    careersDomains: ['jobs2.deloitte.com', 'deloitte.com/careers'],
    standardHiringProcess: 'Aptitude test, case study, partner interview. Zero recruitment fee policy.',
    zeroFeePolicy: true
  },
  {
    name: 'Goldman Sachs',
    aliases: ['Goldman Sachs Group', 'GS'],
    officialDomains: ['goldmansachs.com'],
    careersDomains: ['goldmansachs.com/careers'],
    standardHiringProcess: 'Engineering Campus Hiring Assessment (HackerRank), multiple round superday.',
    zeroFeePolicy: true
  },
  {
    name: 'IBM',
    aliases: ['IBM Corporation', 'IBM India'],
    officialDomains: ['ibm.com'],
    careersDomains: ['ibm.com/careers'],
    standardHiringProcess: 'Formal application via IBM careers, online coding assessment, interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'HCLTech',
    aliases: ['HCL Technologies', 'HCL Tech'],
    officialDomains: ['hcltech.com', 'hcl.com'],
    careersDomains: ['hcltech.com/careers'],
    standardHiringProcess: 'Online assessment, technical and HR interviews. No candidate fees.',
    zeroFeePolicy: true
  },
  {
    name: 'Cognizant',
    aliases: ['Cognizant Technology Solutions', 'CTS'],
    officialDomains: ['cognizant.com'],
    careersDomains: ['careers.cognizant.com'],
    standardHiringProcess: 'Campus or portal application, online assessment, technical and HR interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Capgemini',
    aliases: ['Capgemini India'],
    officialDomains: ['capgemini.com'],
    careersDomains: ['capgemini.com/careers'],
    standardHiringProcess: 'Online assessment, technical and HR interviews via official careers portal.',
    zeroFeePolicy: true
  },
  {
    name: 'Tech Mahindra',
    aliases: ['TechM', 'Tech Mahindra Ltd'],
    officialDomains: ['techmahindra.com'],
    careersDomains: ['careers.techmahindra.com'],
    standardHiringProcess: 'Online assessment, technical and HR interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Oracle',
    aliases: ['Oracle Corporation', 'Oracle India'],
    officialDomains: ['oracle.com'],
    careersDomains: ['careers.oracle.com'],
    standardHiringProcess: 'Application via careers.oracle.com, coding assessment, technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Adobe',
    aliases: ['Adobe Inc', 'Adobe Systems'],
    officialDomains: ['adobe.com'],
    careersDomains: ['careers.adobe.com'],
    standardHiringProcess: 'Application via careers.adobe.com, coding assessment, technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Intel',
    aliases: ['Intel Corporation', 'Intel India'],
    officialDomains: ['intel.com'],
    careersDomains: ['jobs.intel.com'],
    standardHiringProcess: 'Application via jobs.intel.com, technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Zoho',
    aliases: ['Zoho Corporation', 'Zoho Corp'],
    officialDomains: ['zoho.com', 'zohocorp.com'],
    careersDomains: ['careers.zohocorp.com'],
    standardHiringProcess: 'Written test, programming rounds and interviews. No fees.',
    zeroFeePolicy: true
  },
  {
    name: 'Flipkart',
    aliases: ['Flipkart Internet'],
    officialDomains: ['flipkart.com', 'flipkartcareers.com'],
    careersDomains: ['flipkartcareers.com'],
    standardHiringProcess: 'Coding assessment, problem-solving and hiring-manager interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Razorpay',
    aliases: ['Razorpay Software'],
    officialDomains: ['razorpay.com'],
    careersDomains: ['razorpay.com/jobs'],
    standardHiringProcess: 'Coding assessment and technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Swiggy',
    aliases: ['Bundl Technologies'],
    officialDomains: ['swiggy.com', 'swiggy.in'],
    careersDomains: ['careers.swiggy.com'],
    standardHiringProcess: 'Coding assessment and technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'Zomato',
    aliases: ['Eternal Ltd'],
    officialDomains: ['zomato.com'],
    careersDomains: ['zomato.com/careers'],
    standardHiringProcess: 'Coding assessment and technical interviews.',
    zeroFeePolicy: true
  },
  {
    name: 'PhonePe',
    aliases: ['PhonePe Private Limited'],
    officialDomains: ['phonepe.com'],
    careersDomains: ['phonepe.com/careers'],
    standardHiringProcess: 'Coding assessment and technical interviews.',
    zeroFeePolicy: true
  }
];

export const FREE_PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'proton.me',
  'protonmail.com',
  'rediffmail.com',
  'zoho.com',
  'zoho.in',
  'mail.com',
  'gmx.com',
  'aol.com',
  'icloud.com',
  'inbox.com',
  'yandex.com',
  'yandex.ru'
]);

export const VERIFIED_ENTERPRISE_ATS_DOMAINS = [
  'greenhouse.io',
  'boards.greenhouse.io',
  'lever.co',
  'jobs.lever.co',
  'myworkdayjobs.com',
  'workday.com',
  'ashbyhq.com',
  'jobs.ashbyhq.com',
  'smartrecruiters.com',
  'icims.com',
  'taleo.net',
  'jobvite.com',
  'bamboohr.com',
  'recruitee.com',
  'workable.com',
  'ripplehire.com'
];

export const SUSPICIOUS_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  't.ly',
  'shorturl.at',
  'v.gd',
  'ow.ly'
];

export const SUSPICIOUS_CHAT_DOMAINS = [
  't.me',
  'telegram.me',
  'wa.me',
  'chat.whatsapp.com',
  'discord.gg',
  'signal.group'
];
