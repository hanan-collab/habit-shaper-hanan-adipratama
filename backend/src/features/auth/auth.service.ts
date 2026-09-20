import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { AppError } from '../../common/app-error.js';
import type { LoginDto, OnboardingDto, RegisterDto } from './auth.dto.js';
import { AuthErrorCode } from './auth.enum.js';
import type { AuthResult, PublicUser } from './auth.model.js';
import { DuplicateEmailRepositoryError, type AuthRepository } from './auth.repository.js';

export interface AuthService {
  register(input: RegisterDto): Promise<AuthResult>;
  login(input: LoginDto): Promise<AuthResult>;
  getUserForToken(token: string): Promise<PublicUser | null>;
  logout(token: string): Promise<void>;
  completeOnboarding(userId: string, input: OnboardingDto): Promise<PublicUser>;
}

type ServiceConfig = { bcryptRounds: number; sessionTtlDays: number };
const dummyPasswordHash = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5YdTrr9Jy1XqZqH8QPc7hVOwjWIz5qS';
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function newSession(config: ServiceConfig) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashToken(token), expiresAt };
}

export function createAuthService(repository: AuthRepository, config: ServiceConfig): AuthService {
  return {
    async register(input) {
      const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
      const session = newSession(config);
      try {
        const user = await repository.createUserWithSession({
          email: input.email,
          passwordHash,
          timezone: input.timezone,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        });
        return { user, token: session.token, expiresAt: session.expiresAt };
      } catch (error) {
        if (error instanceof DuplicateEmailRepositoryError) {
          throw new AppError(409, AuthErrorCode.EmailAlreadyExists, 'An account with this email already exists');
        }
        throw error;
      }
    },
    async login(input) {
      const account = await repository.findAccountByEmail(input.email);
      const matches = await bcrypt.compare(input.password, account?.passwordHash ?? dummyPasswordHash);
      if (!account || !matches) {
        throw new AppError(401, AuthErrorCode.InvalidCredentials, 'Email or password is incorrect');
      }
      const session = newSession(config);
      await repository.createSession({ userId: account.id, tokenHash: session.tokenHash, expiresAt: session.expiresAt });
      const { passwordHash: _passwordHash, ...user } = account;
      return { user, token: session.token, expiresAt: session.expiresAt };
    },
    async getUserForToken(token) {
      if (!token) return null;
      const session = await repository.findSessionWithUser(hashToken(token));
      if (!session) return null;
      const now = new Date();
      if (session.expiresAt <= now) {
        await repository.deleteSessionById(session.id);
        return null;
      }
      if (now.getTime() - session.lastUsedAt.getTime() >= 5 * 60 * 1000) {
        await repository.touchSession(session.id, now);
      }
      return session.user;
    },
    async logout(token) {
      if (token) await repository.deleteSessionByTokenHash(hashToken(token));
    },
    completeOnboarding(userId, input) {
      return repository.completeOnboarding(userId, input.timezone);
    },
  };
}
