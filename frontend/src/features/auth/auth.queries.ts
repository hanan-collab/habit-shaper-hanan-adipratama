import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { authApi } from './auth.api';

export const sessionKey = queryKeys.session;
export const useSession = () => useQuery({ queryKey: sessionKey, queryFn: authApi.me });
