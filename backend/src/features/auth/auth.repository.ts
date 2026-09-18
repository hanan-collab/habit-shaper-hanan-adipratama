import { Prisma, type PrismaClient } from '@prisma/client';
import type { AccountModel, PublicUser, SessionWithUserModel } from './auth.model.js';

export class DuplicateEmailRepositoryError extends Error {}

const publicUserSelect = {
  id: true,
  email: true,
  timezone: true,
  onboardingCompletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export interface AuthRepository {
  createUserWithSession(input: {
    email: string; passwordHash: string; timezone: string; tokenHash: string; expiresAt: Date;
  }): Promise<PublicUser>;
  findAccountByEmail(email: string): Promise<AccountModel | null>;
  createSession(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findSessionWithUser(tokenHash: string): Promise<SessionWithUserModel | null>;
  deleteSessionById(id: string): Promise<void>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  touchSession(id: string, date: Date): Promise<void>;
  completeOnboarding(userId: string, date: Date): Promise<PublicUser>;
}

export function createAuthRepository(prisma: PrismaClient): AuthRepository {
  return {
    async createUserWithSession(input) {
      try {
        return await prisma.$transaction(async (transaction) => {
          const user = await transaction.user.create({
            data: { email: input.email, passwordHash: input.passwordHash, timezone: input.timezone },
            select: publicUserSelect,
          });
          await transaction.session.create({
            data: { userId: user.id, tokenHash: input.tokenHash, expiresAt: input.expiresAt },
          });
          return user;
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new DuplicateEmailRepositoryError();
        }
        throw error;
      }
    },
    findAccountByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },
    async createSession(input) {
      await prisma.session.create({ data: input });
    },
    findSessionWithUser(tokenHash) {
      return prisma.session.findUnique({
        where: { tokenHash },
        select: { id: true, expiresAt: true, lastUsedAt: true, user: { select: publicUserSelect } },
      });
    },
    async deleteSessionById(id) {
      await prisma.session.deleteMany({ where: { id } });
    },
    async deleteSessionByTokenHash(tokenHash) {
      await prisma.session.deleteMany({ where: { tokenHash } });
    },
    async touchSession(id, date) {
      await prisma.session.updateMany({ where: { id }, data: { lastUsedAt: date } });
    },
    completeOnboarding(userId, date) {
      return prisma.user.update({
        where: { id: userId }, data: { onboardingCompletedAt: date }, select: publicUserSelect,
      });
    },
  };
}
