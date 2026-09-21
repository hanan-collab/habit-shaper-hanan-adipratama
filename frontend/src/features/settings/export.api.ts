import { api } from '../../lib/api';
import type { ExportResponse } from './dto/response/export.response';

export const exportApi = { get: () => api<ExportResponse>('/export') };
