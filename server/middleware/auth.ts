import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../../database/config.js';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const DEMO_TOKEN = process.env.DEMO_AUTH_TOKEN || 'demo-token-123';
const ENABLE_DEMO_AUTH = process.env.ENABLE_DEMO_AUTH === 'true';

const demoUser: AuthenticatedUser = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  username: 'demo_user',
  email: 'demo@researchlab.com',
  role: 'student',
  status: 'active',
  first_name: 'Demo',
  last_name: 'User'
};

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (ENABLE_DEMO_AUTH) {
        req.user = demoUser;
        return next();
      }

      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (token === DEMO_TOKEN && ENABLE_DEMO_AUTH) {
      req.user = demoUser;
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, role, status 
       FROM users 
       WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      first_name: user.first_name,
      last_name: user.last_name
    };

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
};

export const demoAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (ENABLE_DEMO_AUTH) {
    req.user = demoUser;
    return next();
  }

  return authenticateToken(req, res, next);
};
