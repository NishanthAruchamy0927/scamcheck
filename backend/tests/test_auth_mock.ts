import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';
import { dbClient } from '../src/database/dbClient.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Authentication & Security Tests', () => {
  it('rejects login for an unknown user', async () => {
    // Prisma model delegates are proxies, so swap the delegate rather than mock.method on it
    (dbClient.user as any) = { findUnique: async () => null };
    (dbClient.loginAttempt as any) = { create: async () => ({}) };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
  });
});
