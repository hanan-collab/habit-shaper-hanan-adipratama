import { api } from '../../lib/api';
import type { DashboardResponse } from './dto/response/dashboard.response';
export const dashboardApi = { get: () => api<DashboardResponse>('/dashboard') };
