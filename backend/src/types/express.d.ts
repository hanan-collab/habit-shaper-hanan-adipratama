import type { PublicUser } from '../features/auth/auth.model.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicUser;
      requestId: string;
    }
  }
}

export {};
