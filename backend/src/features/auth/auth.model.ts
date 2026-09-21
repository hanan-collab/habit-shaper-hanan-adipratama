import type { User } from '@prisma/client';

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'username' | 'timezone' | 'onboardingCompleted' | 'createdAt' | 'updatedAt'
>;
export type AccountModel = User;
export type AuthResult = { user: PublicUser; token: string; expiresAt: Date };
export type SessionWithUserModel = { id: string; expiresAt: Date; lastUsedAt: Date; user: PublicUser };

export function publicUserResponse(user: PublicUser) {
  return { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() };
}
