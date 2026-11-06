// Base del contrato API (TDD-SW-008). Mismo host que la SPA, sin CORS (ADR-CLD-001).
export const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`La API respondió ${status}`);
    this.name = 'ApiError';
  }
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}
