import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';

import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { AuditService } from '../../core/services/administration/audit.service';
import {
  AuditAction,
  AuditLog,
  AuditLogPage,
  AuditLogQuery,
  AuditTable,
} from '../../store/Audit/audit-model';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

interface DetailEntry {
  label: string;
  value: string;
}

interface ColumnHelp {
  column: string;
  title: string;
  description: string;
  example?: string;
}

const COLUMN_HELP: ColumnHelp[] = [
  {
    column: 'event_id',
    title: 'ID unico del evento',
    description:
      'Identificador autoincremental del registro de auditoria. Es la PK de la tabla audit.logged_actions y sirve para referenciar un evento puntual.',
    example: '#1234',
  },
  {
    column: 'schema_name',
    title: 'Esquema',
    description:
      'Esquema de la base donde vive la tabla auditada (ej: auth, audit, public).',
    example: 'auth',
  },
  {
    column: 'table_name',
    title: 'Tabla',
    description:
      'Nombre de la tabla donde ocurrio el cambio, sin prefijo de esquema.',
    example: 'roles',
  },
  {
    column: 'relid',
    title: 'OID de la tabla',
    description:
      'Identificador interno de Postgres para la tabla (table OID). Cambia si la tabla se hace DROP + CREATE, por eso normalmente filtras por table_name y no por relid.',
    example: '16453',
  },
  {
    column: 'session_user_name',
    title: 'Usuario de sesion de Postgres',
    description:
      'Usuario que abrio la conexion JDBC contra la base (el del JDBC_URL). NO es el usuario logueado de tu app. Para saber quien hizo el cambio a nivel de aplicacion mira created_by / last_modified_by en la tabla auditada.',
    example: 'ucaapp_user',
  },
  {
    column: 'action_tstamp_tx',
    title: 'Inicio de la transaccion',
    description:
      'Timestamp en el que comenzo la transaccion que provoco el evento. Todos los eventos de una misma transaccion comparten este valor — util para agrupar cambios relacionados.',
    example: '28/05/2026 14:32:10',
  },
  {
    column: 'action_tstamp_stm',
    title: 'Inicio del statement',
    description:
      'Timestamp del inicio del statement SQL especifico dentro de la transaccion. Si una transaccion ejecuta varios statements, cada uno tiene el suyo.',
  },
  {
    column: 'action_tstamp_clk',
    title: 'Reloj del trigger',
    description:
      'Wall-clock del momento exacto en que el trigger se disparo. Es el mas preciso de los tres timestamps; util para correlacionar con logs de Spring.',
  },
  {
    column: 'transaction_id',
    title: 'ID de transaccion',
    description:
      'Identificador de la transaccion en Postgres (txid_current). Combinado con action_tstamp_tx te permite agrupar todos los cambios que entraron juntos.',
    example: '892341',
  },
  {
    column: 'application_name',
    title: 'Aplicacion cliente',
    description:
      'Nombre que el cliente se asigno al conectarse a Postgres. Ayuda a distinguir cambios hechos por la app (PostgreSQL JDBC Driver) vs herramientas como pgAdmin, DBeaver o psql.',
    example: 'PostgreSQL JDBC Driver',
  },
  {
    column: 'client_addr',
    title: 'IP del cliente',
    description:
      'Direccion IP que abrio la conexion contra Postgres. En setups Docker sin propagacion de IP real, vas a ver siempre la IP del contenedor Spring (ej: 172.x.x.x) o el gateway de Docker (ej: 192.168.65.1).',
    example: '192.168.65.1',
  },
  {
    column: 'client_port',
    title: 'Puerto del cliente',
    description:
      'Puerto efimero usado por el cliente al conectarse. Tiene poca utilidad practica; sirve solo en forensia de redes.',
  },
  {
    column: 'client_query',
    title: 'Query SQL completo',
    description:
      'El SQL exacto que disparo el cambio (el top-level query del cliente). Util cuando necesitas reproducir o entender que se ejecuto.',
    example: 'UPDATE auth.roles SET name = ? WHERE id = ?',
  },
  {
    column: 'action',
    title: 'Tipo de operacion',
    description:
      'Letra que indica el tipo de cambio: I = INSERT (creacion), U = UPDATE (modificacion), D = DELETE (eliminacion), T = TRUNCATE (vaciado masivo).',
    example: 'U',
  },
  {
    column: 'row_data',
    title: 'Datos de la fila',
    description:
      'Snapshot hstore (clave/valor) de la fila afectada. En INSERT contiene la fila NUEVA; en UPDATE y DELETE contiene la fila OLD (antes del cambio). Es lo que te permite reconstruir el estado previo.',
  },
  {
    column: 'changed_fields',
    title: 'Campos modificados',
    description:
      'Solo para UPDATE: hstore con los NUEVOS valores de las columnas que efectivamente cambiaron. Si comparas row_data vs changed_fields tienes el delta exacto del UPDATE.',
  },
  {
    column: 'statement_only',
    title: 'Solo statement',
    description:
      'Si es true significa que el evento provino de un trigger a nivel de statement (no por fila). Tipicamente solo aparece en TRUNCATE. Para INSERT/UPDATE/DELETE normales es false.',
  },
];

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, LucideAngularModule],
  templateUrl: './audit-logs.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class AuditLogsComponent implements OnInit {
  readonly pageSizeOptions = [25, 50, 100, 200];
  readonly actionOptions: { value: AuditAction | ''; label: string }[] = [
    { value: '', label: 'Todas las acciones' },
    { value: 'I', label: 'Insert (I)' },
    { value: 'U', label: 'Update (U)' },
    { value: 'D', label: 'Delete (D)' },
    { value: 'T', label: 'Truncate (T)' },
  ];

  filters: AuditLogQuery = {
    page: 0,
    size: 50,
    from: '',
    to: '',
    table: '',
    action: '',
    search: '',
  };

  rows: AuditLog[] = [];
  tables: AuditTable[] = [];
  page = 0;
  size = 50;
  totalElements = 0;
  totalPages = 0;
  numberOfElements = 0;

  loading = false;
  expanded = new Set<number>();

  showHelp = false;
  scrolled = false;
  readonly columnHelp: ColumnHelp[] = COLUMN_HELP;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 120;
  }

  constructor(
    private auditService: AuditService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTables();
    this.loadPage();
  }

  get pageWindow(): number[] {
    if (this.totalPages <= 1) {
      return [0];
    }
    const window = 5;
    const start = Math.max(0, Math.min(this.page - 2, this.totalPages - window));
    const end = Math.min(this.totalPages, start + window);
    const pages: number[] = [];
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  loadTables(): void {
    this.auditService.listTables().subscribe({
      next: (tables) => (this.tables = tables ?? []),
      error: () => (this.tables = []),
    });
  }

  loadPage(): void {
    this.loading = true;
    this.auditService.getPagedActions(this.filters).subscribe({
      next: (response: AuditLogPage) => {
        this.rows = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.numberOfElements = response.numberOfElements;
        this.expanded.clear();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, 'No fue posible cargar las auditorias');
      },
    });
  }

  applyFilters(): void {
    this.filters.page = 0;
    this.loadPage();
  }

  clearFilters(): void {
    this.filters = {
      page: 0,
      size: this.filters.size ?? 50,
      from: '',
      to: '',
      table: '',
      action: '',
      search: '',
    };
    this.loadPage();
  }

  changePageSize(): void {
    this.filters.page = 0;
    this.loadPage();
  }

  goToPage(target: number): void {
    if (target < 0 || target >= this.totalPages || target === this.page) {
      return;
    }
    this.filters.page = target;
    this.loadPage();
  }

  openHelp(): void {
    this.showHelp = true;
  }

  closeHelp(): void {
    this.showHelp = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showHelp) {
      this.closeHelp();
    }
  }

  toggleExpand(eventId: number): void {
    if (this.expanded.has(eventId)) {
      this.expanded.delete(eventId);
    } else {
      this.expanded.add(eventId);
    }
  }

  actionBadgeClass(action: AuditAction | string): string {
    switch (action) {
      case 'I':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'U':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
      case 'D':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
      case 'T':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-zink-600 dark:text-zink-200';
    }
  }

  actionLabel(action: AuditAction | string): string {
    switch (action) {
      case 'I':
        return 'INSERT';
      case 'U':
        return 'UPDATE';
      case 'D':
        return 'DELETE';
      case 'T':
        return 'TRUNCATE';
      default:
        return String(action ?? '');
    }
  }

  formatTimestamp(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  detailEntries(row: AuditLog): DetailEntry[] {
    return [
      { label: 'Schema', value: row.schema_name ?? '-' },
      { label: 'Relid', value: String(row.relid ?? '-') },
      { label: 'Transaction ID', value: String(row.transaction_id ?? '-') },
      { label: 'Application', value: row.application_name ?? '-' },
      { label: 'Client port', value: String(row.client_port ?? '-') },
      { label: 'Statement only', value: row.statement_only ? 'Si' : 'No' },
      { label: 'Statement ts', value: this.formatTimestamp(row.action_tstamp_stm) },
      { label: 'Clock ts', value: this.formatTimestamp(row.action_tstamp_clk) },
    ];
  }

  hstoreEntries(value: Record<string, string> | null | undefined): { key: string; value: string }[] {
    if (!value) {
      return [];
    }
    return Object.entries(value).map(([key, val]) => ({
      key,
      value: val == null ? 'null' : String(val),
    }));
  }

  private handleError(error: unknown, fallbackMessage: string): void {
    const apiError = error as { error?: ApiErrorModel };
    const response = apiError?.error;
    const message =
      response?.errors?.[0]?.message || response?.message || fallbackMessage;
    const title = response?.errors?.[0]?.error || 'ERROR';
    this.toastr.error(message, title);
  }
}
