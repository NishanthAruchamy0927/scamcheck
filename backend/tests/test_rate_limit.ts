import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Must be set before the routes module creates its limiter
delete process.env.DATABASE_URL;
process.env.ANALYSIS_RATE_LIMIT_PER_MIN = '3';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/app.js').default as import('express').Express;

describe('Analysis rate limiting', () => {
  it('returns 429 once a client exceeds the per-minute limit', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/company-check').send({ companyName: 'Acme Labs' });
      statuses.push(res.status);
    }
    assert.deepStrictEqual(statuses.slice(0, 3), [200, 200, 200]);
    assert.strictEqual(statuses[3], 429);
  });

  it('does not rate limit the health check', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
  });
});
