export interface CatiaToolPermission {
  id: number;
  toolName: string;
  allowedRoles: string[];
  enabled: boolean;
  // Tiempo de enfriamiento entre invocaciones (en segundos); 0/null = sin enfriamiento
  cooldownSeconds?: number | null;
}

export interface CatiaToolPermissionUpsertRequest {
  allowedRoles: string[];
  enabled?: boolean | null;
  cooldownSeconds?: number | null;
}

// Mapa tal cual se envía al modelo (toolName -> roles permitidos)
export type CatiaToolPermissionsMap = Record<string, string[]>;

// Roles sugeridos por defecto para el editor (el usuario puede escribir otros)
export const CATIA_DEFAULT_TOOL_ROLES: readonly string[] = [
  'ADMINISTRATIVO',
  'DOCENTE',
  'ENCARGATURA',
  'ESTUDIANTE',
] as const;
