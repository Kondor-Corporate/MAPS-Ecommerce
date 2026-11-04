// Tipos de eslint/architecture.mjs para los tests de arquitectura (apps/api/tests/architecture).
import type { Linter } from 'eslint';

export function apiArchitecture(options?: {
  root?: string;
  tsconfig?: string;
  typesPackage?: string;
}): Linter.Config[];

export function notAllowedSpecifier(allowed?: string[]): string;
