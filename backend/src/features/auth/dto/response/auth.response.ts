import type { publicUserResponse } from '../../auth.model.js';

export type AuthUserResponse = { user: ReturnType<typeof publicUserResponse> };
