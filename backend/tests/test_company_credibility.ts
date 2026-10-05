import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractEntities } from '../src/engine/entityExtractor.js';
import {
  evaluateCompanyCredibility,
  parseLinkedInCompanyHtml,
  parseCount,
  findLinkedInUrl
} from '../src/engine/companyCredibility.js';

const check = (text: string, extra: Partial<Parameters<typeof evaluateCompanyCredibility>[0]> = {}) =>
  evaluateCompanyCredibility({ text, entities: extractEntities(text), fetchLinkedIn: false, ...extra });

describe('LinkedIn parsing helpers', () => {
  it('parses LinkedIn-style counts', () => {
    assert.strictEqual(parseCount('1.2K'), 1200);
    assert.strictEqual(parseCount('3M'), 3_000_000);
    assert.strictEqual(parseCount('12,345'), 12345);
  });

  it('finds company and regional LinkedIn URLs in text', () => {
    assert.strictEqual(findLinkedInUrl('see https://in.linkedin.com/company/acme-tech/ now'), 'https://in.linkedin.com/company/acme-tech/');
    assert.strictEqual(findLinkedInUrl('no link here'), null);
  });

  it('extracts facts from a public company page and ignores script content', () => {
    const html = `<html><head><meta property="og:title" content="Acme Technologies | LinkedIn">
      <meta name="description" content="Acme Technologies | 12,345 followers on LinkedIn."></head>
      <body><script>var x = "999 followers";</script>
      <dt>Website</dt><dd>https://acme.io</dd><dt>Industry</dt><dd>IT Services</dd>
      <dt>Company size</dt><dd>51-200 employees</dd><dt>Founded</dt><dd>2016</dd>
      <a>View all 143 employees</a></body></html>`;
    const { pageTitle, facts } = parseLinkedInCompanyHtml(html);
    assert.strictEqual(pageTitle, 'Acme Technologies');
    assert.strictEqual(facts.followers, 12345);
    assert.strictEqual(facts.employeesOnLinkedIn, 143);
    assert.strictEqual(facts.foundedYear, 2016);
    assert.strictEqual(facts.website, 'https://acme.io');
  });
});

describe('Company credibility & career value', () => {
  it('recognises a known enterprise paid internship as high value', async () => {
    const r = await check('Google Software Engineering Intern. Stipend INR 1,10,000/month. Online coding assessment and technical interviews.');
    assert.strictEqual(r.isKnownEnterprise, true);
    assert.strictEqual(r.verdict, 'REPUTABLE');
    assert.strictEqual(r.careerValue.verdict, 'HIGH_VALUE');
  });

  it('does not treat a "Google Form" mention as Google', async () => {
    const r = await check('Apply for the internship at Nexa Labs using this Google Form. Stipend 5000 per month.');
    assert.strictEqual(r.isKnownEnterprise, false);
  });

  it('flags the certificate-mill LinkedIn pattern', async () => {
    const r = await check('Web development virtual internship. Certificate fee Rs 499.', {
      companyName: 'CodeSkill Infotech',
      linkedinFacts: { followers: 45000, employeesOnLinkedIn: 8, foundedYear: new Date().getFullYear(), postsMostlyCertificates: true }
    });
    assert.ok(r.factors.some((f) => f.label === 'Followers far exceed employees'));
    assert.strictEqual(r.verdict, 'RED_FLAGS');
    assert.strictEqual(r.careerValue.programModel, 'PAY_FOR_CERTIFICATE');
    assert.notStrictEqual(r.careerValue.verdict, 'HIGH_VALUE');
  });

  it('classifies a paid course sold as an internship', async () => {
    const r = await check('Data science internship program. Training fee Rs 4999 includes recorded videos and certificate.');
    assert.strictEqual(r.careerValue.programModel, 'PAID_TRAINING_PROGRAM');
  });

  it('caps an unverified company at moderate career value', async () => {
    const r = await check('Hiring SDE interns at Zeta. Stipend 40k/month, 2 interview rounds, mentor, PPO.');
    assert.strictEqual(r.careerValue.verdict, 'MODERATE_VALUE');
  });

  it('says "not enough info" rather than guessing', async () => {
    const r = await check('', { companyName: 'Acme Labs' });
    assert.strictEqual(r.careerValue.verdict, 'NOT_ENOUGH_INFO');
    assert.strictEqual(r.evidenceLevel, 'MINIMAL');
    assert.strictEqual(r.verdict, 'UNPROVEN');
  });

  it('never uses a personal profile slug as the company name', async () => {
    const r = await check('', { linkedinUrl: 'https://www.linkedin.com/in/john-doe-hr' });
    assert.strictEqual(r.linkedin.status, 'PERSONAL_PROFILE');
    assert.strictEqual(r.companyName, 'Unknown company');
  });

  it('student-entered facts override auto-fetched ones and are labelled', async () => {
    const r = await check('', { companyName: 'Acme', linkedinFacts: { followers: 500 } });
    assert.strictEqual(r.linkedin.facts.followers, 500);
    assert.strictEqual(r.linkedin.factSources.followers, 'USER_PROVIDED');
  });

  it('extracts organisation names without running across sentences', () => {
    assert.strictEqual(extractEntities('Organization: Acme Technologies\n\nMessage: hello').organization, 'Acme Technologies');
    assert.strictEqual(extractEntities('Hiring SDE interns at Zeta. Stipend 40k').organization, 'Zeta');
  });
});
