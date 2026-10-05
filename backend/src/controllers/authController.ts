import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbClient } from '../database/dbClient.js';
import { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

const generateTokens = (userId: string, role: string) => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  const accessToken = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'], algorithm: 'HS256' });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required' } });
      return;
    }

    const existingUser = await dbClient.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      // Return generic error to prevent email enumeration where possible, 
      // but typical registration endpoints do tell you if email is taken. 
      // Safe error:
      res.status(400).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'Email is already in use.' } });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await dbClient.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: name,
        role: 'USER' // Hardcode to USER to prevent mass assignment
      }
    });

    await dbClient.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user.id,
        actorId: user.id
      }
    });

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required' } });
      return;
    }

    const user = await dbClient.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordHash || !user.isActive) {
      if (user) {
        await dbClient.auditLog.create({
          data: {
            action: 'LOGIN_FAILED',
            resourceType: 'User',
            resourceId: user.id,
            actorId: user.id,
            metadata: { reason: !user.isActive ? 'ACCOUNT_DISABLED' : 'INVALID_CREDENTIALS' }
          }
        });
      }
      res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_FAILED', message: 'Invalid credentials' } });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await dbClient.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          resourceType: 'User',
          resourceId: user.id,
          actorId: user.id,
          metadata: { reason: 'INVALID_CREDENTIALS' }
        }
      });
      res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_FAILED', message: 'Invalid credentials' } });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await dbClient.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    await dbClient.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await dbClient.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        resourceType: 'User',
        resourceId: user.id,
        actorId: user.id
      }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
      return;
    }

    const savedToken = await dbClient.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!savedToken || savedToken.isRevoked || savedToken.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } });
      return;
    }

    if (!savedToken.user.isActive) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User is disabled' } });
      return;
    }

    // Refresh token rotation
    await dbClient.refreshToken.update({
      where: { id: savedToken.id },
      data: { isRevoked: true }
    });

    const tokens = generateTokens(savedToken.user.id, savedToken.user.role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await dbClient.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: savedToken.user.id,
        expiresAt
      }
    });
    
    await dbClient.auditLog.create({
      data: {
        action: 'TOKEN_REFRESH',
        resourceType: 'User',
        resourceId: savedToken.user.id,
        actorId: savedToken.user.id
      }
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await dbClient.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true }
      });
      
      const savedToken = await dbClient.refreshToken.findUnique({ where: { token: refreshToken }});
      if(savedToken) {
        await dbClient.auditLog.create({
          data: {
            action: 'LOGOUT',
            resourceType: 'User',
            resourceId: savedToken.userId,
            actorId: savedToken.userId
          }
        });
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const user = await dbClient.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or disabled' } });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
