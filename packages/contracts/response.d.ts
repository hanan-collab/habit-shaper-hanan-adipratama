export type ErrorResponse = { error: { code: string; message: string; fields?: Record<string, string[]> } };
export type CompositionMetaResponse<TEvent> = { gamificationEvents: TEvent[] };
