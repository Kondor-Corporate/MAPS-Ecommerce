export type OutboxWriterPort = { append(event: unknown): Promise<void> };
