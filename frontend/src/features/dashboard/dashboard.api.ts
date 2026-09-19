import{api}from'../../lib/api';import type{Dashboard}from'../../types/domain';export const dashboardApi={get:()=>api<{dashboard:Dashboard}>('/dashboard')};
