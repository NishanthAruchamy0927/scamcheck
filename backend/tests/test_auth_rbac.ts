import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';
import apiRoutes from '../src/routes/api.js';
import { dbClient } from '../src/database/dbClient.js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

process.env.JWT_SECRET = 'test_secret';

describe('Authentication & RBAC Tests', () => {

  beforeEach(() => {
    mock.restoreAll();
  });

  it('1. Registration - valid registration -> success', async () => {
    (dbClient.user as any) = {
      findUnique: async () => null,
      create: async (args: any) => ({
        id: 'user-1',
        email: args.data.email,
        role: 'USER',
        isActive: true
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@example.com',
      password: 'StrongPassword1!',
      name: 'Test User'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
  });

  it('2. Registration - duplicate email -> safe error', async () => {
    (dbClient.user as any) = { findUnique: async () => ({ id: 'existing' }) };
    
    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@example.com',
      password: 'StrongPassword1!'
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'EMAIL_IN_USE');
  });

  it('3. Login - correct password -> success', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (dbClient.user as any) = {
      findUnique: async () => ({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hash,
        role: 'USER',
        isActive: true
      }),
      update: async () => ({})
    };
    (dbClient.refreshToken as any) = { create: async () => ({}) };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.accessToken);
    assert.ok(res.headers['set-cookie'][0].includes('refreshToken'));
  });

  it('4. Login - incorrect password -> rejection', async () => {
    const hash = await bcrypt.hash('password123', 10);
    (dbClient.user as any) = {
      findUnique: async () => ({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hash,
        role: 'USER',
        isActive: true
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
  });

  it('5. Login - disabled user -> rejection', async () => {
    (dbClient.user as any) = {
      findUnique: async () => ({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'USER',
        isActive: false
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
  });

  it('6. Authentication - invalid/expired token -> rejection', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-jwt-token');

    assert.strictEqual(res.status, 401);
  });

  it('7. Ownership - User A -> own investigation -> allowed', async () => {
    const token = jwt.sign({ sub: 'user-A', role: 'USER' }, process.env.JWT_SECRET!);
    (dbClient.user as any) = { findUnique: async () => ({ id: 'user-A', isActive: true, role: 'USER' }) };
    
    (dbClient.investigation as any) = {
      findUnique: async () => ({
        id: 'inv-1',
        userId: 'user-A'
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).get('/api/investigations/inv-1')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, 'inv-1');
  });

  it('8. Ownership - User A -> User B investigation -> denied (404)', async () => {
    const token = jwt.sign({ sub: 'user-A', role: 'USER' }, process.env.JWT_SECRET!);
    (dbClient.user as any) = { findUnique: async () => ({ id: 'user-A', isActive: true, role: 'USER' }) };
    
    (dbClient.investigation as any) = {
      findUnique: async () => ({
        id: 'inv-2',
        userId: 'user-B'
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).get('/api/investigations/inv-2')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 404);
  });

  it('9. RBAC - SYSTEM_ADMIN -> User B investigation -> allowed', async () => {
    const token = jwt.sign({ sub: 'admin-1', role: 'SYSTEM_ADMIN' }, process.env.JWT_SECRET!);
    (dbClient.user as any) = { findUnique: async () => ({ id: 'admin-1', isActive: true, role: 'SYSTEM_ADMIN' }) };
    
    (dbClient.investigation as any) = {
      findUnique: async () => ({
        id: 'inv-2',
        userId: 'user-B'
      })
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    const res = await request(app).get('/api/investigations/inv-2')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(res.status, 200);
  });

  it('10. Role Escalation Protection - POST /register mass assignment blocked', async () => {
    let createdRole = '';
    (dbClient.user as any) = {
      findUnique: async () => null,
      create: async (args: any) => {
        createdRole = args.data.role;
        return { id: 'user-1', role: args.data.role };
      }
    };
    (dbClient.auditLog as any) = { create: async () => ({}) };

    await request(app).post('/api/auth/register').send({
      email: 'hacker@example.com',
      password: 'pw',
      role: 'SYSTEM_ADMIN' // Attempting mass assignment
    });

    assert.strictEqual(createdRole, 'USER'); // Should be overridden by controller
  });

  console.log('--- TEST DEFINITIONS LOADED ---');
});
