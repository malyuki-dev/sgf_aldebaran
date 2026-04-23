import { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  tipo: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
