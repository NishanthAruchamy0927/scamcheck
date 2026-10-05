import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

// Keep the suite self-contained: no database, no ML service, generous rate limit
delete process.env.DATABASE_URL;
process.env.ML_SERVICE_URL = 'http://127.0.0.1:9';
process.env.ANALYSIS_RATE_LIMIT_PER_MIN = '1000';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/app.js').default as import('express').Express;

const repoRoot = path.resolve(__dirname, '..', '..');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scamcheck-api-test-'));
const tmpFile = (name: string, content: Buffer | string) => {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content);
  return p;
};

describe('Investigation API input handling', () => {
  let corruptPng: string;
  let fakePdf: string;

  before(() => {
    corruptPng = tmpFile('corrupt.png', Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('garbage')]));
    fakePdf = tmpFile('fake.pdf', 'this is not a pdf');
  });

  it('returns 400 (not 500) for malformed JSON', async () => {
    const res = await request(app).post('/api/investigate').set('Content-Type', 'application/json').send('{"text": }');
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /not valid JSON/);
  });

  it('returns 400 for a disallowed file type', async () => {
    const res = await request(app).post('/api/investigate').attach('file', Buffer.from('GIF89a'), { filename: 'x.gif', contentType: 'image/gif' });
    assert.strictEqual(res.status, 400);
  });

  it('rejects a renamed file whose bytes do not match its type', async () => {
    const res = await request(app).post('/api/investigate').attach('file', fakePdf, { contentType: 'application/pdf' });
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /does not look like a valid/);
  });

  it('survives a corrupt image that reaches OCR (used to crash the server)', async () => {
    const res = await request(app).post('/api/investigate').attach('file', corruptPng, { contentType: 'image/png' });
    assert.strictEqual(res.status, 400);
    const health = await request(app).get('/api/health');
    assert.strictEqual(health.status, 200);
  });

  it('returns 400 for an empty submission', async () => {
    const res = await request(app).post('/api/investigate').send({ text: '   ' });
    assert.strictEqual(res.status, 400);
  });

  it('flags a fee-based scam as HIGH RISK and attaches the company/career check', async () => {
    const res = await request(app).post('/api/investigate').send({
      text: 'Congratulations! You are selected for an internship at Infosys without interview. Pay Rs 2,999 registration fee within 24 hours on Telegram. Contact infosys.hr2026@gmail.com',
      linkedinUrl: 'https://www.linkedin.com/in/someone'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.riskTier, 'HIGH RISK');
    assert.strictEqual(res.body.companyCredibility.careerValue.verdict, 'AVOID');
    assert.strictEqual(res.body.companyCredibility.linkedin.status, 'PERSONAL_PROFILE');
  });

  it('reads a real screenshot with OCR', { timeout: 120_000 }, async () => {
    const res = await request(app)
      .post('/api/investigate')
      .attach('file', path.join(repoRoot, 'sample_scam_screenshot.jpg'), { contentType: 'image/jpeg' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.multimodal.metadata.ocrUsed, true);
    assert.ok(res.body.inputSnippet.length > 50, 'OCR should extract readable text');
  });
});

describe('Company check API', () => {
  it('requires at least one input', async () => {
    const res = await request(app).post('/api/company-check').send({});
    assert.strictEqual(res.status, 400);
  });

  it('rates a pay-for-certificate program as AVOID', async () => {
    const res = await request(app).post('/api/company-check').send({
      companyName: 'CodeSkill Infotech',
      offerText: 'Virtual internship, no interview required. Complete 4 tasks. Certificate fee Rs 499. Share your certificate on LinkedIn.',
      linkedinFacts: { followers: 45000, employeesOnLinkedIn: 8, postsMostlyCertificates: true }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.verdict, 'RED_FLAGS');
    assert.strictEqual(res.body.careerValue.programModel, 'PAY_FOR_CERTIFICATE');
    assert.strictEqual(res.body.careerValue.verdict, 'AVOID');
  });

  it('ignores invalid LinkedIn fact values instead of failing', async () => {
    const res = await request(app).post('/api/company-check').send({
      companyName: 'Acme Labs',
      linkedinFacts: { followers: 'lots', foundedYear: 3000, employeesOnLinkedIn: -5 }
    });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(Object.keys(res.body.linkedin.facts), []);
  });
});
