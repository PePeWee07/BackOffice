export type AuditAction = 'I' | 'D' | 'U' | 'T';

export interface AuditLog {
  event_id: number;
  schema_name: string;
  table_name: string;
  relid: number;
  session_user_name: string | null;
  action_tstamp_tx: string;
  action_tstamp_stm: string;
  action_tstamp_clk: string;
  transaction_id: number | null;
  application_name: string | null;
  client_addr: string | null;
  client_port: number | null;
  client_query: string | null;
  action: AuditAction;
  row_data: Record<string, string> | null;
  changed_fields: Record<string, string> | null;
  statement_only: boolean;
}

export interface AuditLogPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  numberOfElements: number;
}

export interface AuditLogQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  table?: string;
  action?: AuditAction | '';
  search?: string;
}

export interface AuditTable {
  table_schema: string;
  table_name: string;
}
