import { getJson } from './http';

export interface Health {
  status: 'ok';
}

export function getHealth(signal?: AbortSignal): Promise<Health> {
  return getJson<Health>('/health', signal);
}
