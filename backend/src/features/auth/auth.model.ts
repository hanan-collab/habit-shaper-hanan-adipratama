import type { User } from '@prisma/client';

export type PublicUser = Pick<User, 'id' | 'email' | 'timezone' | 'onboardingCompletedAt' | 'createdAt' | 'updatedAt'>;
export type AccountModel = User;
export type AuthResult = { user: PublicUser; token: string; expiresAt: Date };
export type SessionWithUserModel = { id: string; expiresAt: Date; lastUsedAt: Date; user: PublicUser };
