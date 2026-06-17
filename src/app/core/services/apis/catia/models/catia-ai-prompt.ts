// Configuración del prompt del asistente CatIA (tabla ai_prompt_config del core).

export interface CatiaAiReasoning {
  effort?: string;
  summary?: string;
}

export interface CatiaAiText {
  format?: unknown;
  verbosity?: string;
}

export interface CatiaAiPromptConfig {
  id?: number;
  name?: string;
  active?: boolean;
  version?: number;
  instructions?: string;
  model?: string;
  temperature?: number | null;
  topP?: number | null;
  maxOutputTokens?: number | null;
  reasoning?: CatiaAiReasoning | null;
  tools?: unknown[] | null;
  include?: unknown[] | null;
  text?: CatiaAiText | null;
  store?: boolean | null;
  updatedAt?: string;
}

/**
 * Edición PARCIAL: solo los campos enviados se actualizan.
 * Para vaciar un campo se usa `clear` (enviar null = "no tocar").
 * Los objetos/arrays se REEMPLAZAN completos, no se fusionan.
 */
export interface CatiaAiPromptConfigUpdate {
  instructions?: string;
  model?: string;
  temperature?: number | null;
  topP?: number | null;
  maxOutputTokens?: number | null;
  reasoning?: Record<string, unknown> | null;
  tools?: unknown[] | null;
  include?: unknown[] | null;
  text?: Record<string, unknown> | null;
  store?: boolean | null;
  clear?: string[];
}

export const CATIA_REASONING_EFFORTS: readonly string[] = [
  'none',
  'low',
  'medium',
  'high',
  'xhigh',
] as const;

export const CATIA_REASONING_SUMMARIES: readonly string[] = [
  'auto',
  'concise',
  'detailed',
] as const;

export const CATIA_VERBOSITIES: readonly string[] = [
  'low',
  'medium',
  'high',
] as const;
