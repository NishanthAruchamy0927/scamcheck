import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbClient } from '../database/dbClient.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'JWT_SECRET is not configured' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as { sub: string; role: string };
    
    const user = await dbClient.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User is disabled or does not exist' } });
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    return;
  }
}

export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return next();

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as { sub: string; role: string };
    const user = await dbClient.user.findUnique({
      where: { id: decoded.sub }
    });

    if (user && user.isActive) {
      req.user = { id: user.id, role: user.role };
    }
    next();
  } catch (error) {
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } });
      return;
    }
    next();
  };
}
