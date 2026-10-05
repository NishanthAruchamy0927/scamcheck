import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import authRoutes from '../backend/src/routes/authRoutes.js';
import { dbClient } from '../backend/src/database/dbClient.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Authentication & Security Tests', () => {
  it('should mock the database correctly', async () => {
    mock.method(dbClient.user, 'findUnique', async () => null);
    
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
  });
});
