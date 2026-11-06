export type OutboxPort = { append(event: unknown): Promise<void> };
