import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

// Mock demo user data for bypassing authentication
const mockUser = {
  id: 'demo-user-123',
  username: 'demo_user',
  email: 'demo@researchlab.com',
  role: 'Principal Investigator'
};

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Bypass authentication - always provide mock user data
  req.user = mockUser;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Bypass role checking - mock user has all permissions
    if (!req.user) {
      req.user = mockUser;
    }
    next();
  };
};
