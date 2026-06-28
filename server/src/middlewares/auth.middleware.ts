import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/environment';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

export interface UserPayload {
  userId: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'COMPLIANCE';
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as UserPayload;
    req.currentUser = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Authentication token verification failed');
  }
};

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      throw new ForbiddenError('Access forbidden: insufficient permissions');
    }

    next();
  };
};
