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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  labelKey: string;
  value: string;
}

interface ColumnHelpKey {
  column: string;
  hasExample: boolean;
}

// Cada entrada referencia una sub-clave en
// pagesComponent.auditLogs.help.columns.<column>.{title,description,example}
const COLUMN_HELP_KEYS: ColumnHelpKey[] = [
  { column: 'event_id', hasExample: true },
  { column: 'schema_name', hasExample: true },
  { column: 'table_name', hasExample: true },
  { column: 'relid', hasExample: true },
  { column: 'session_user_name', hasExample: true },
  { column: 'action_tstamp_tx', hasExample: true },
  { column: 'action_tstamp_stm', hasExample: false },
  { column: 'action_tstamp_clk', hasExample: false },
  { column: 'transaction_id', hasExample: true },
  { column: 'application_name', hasExample: true },
  { column: 'client_addr', hasExample: true },
  { column: 'client_port', hasExample: false },
  { column: 'client_query', hasExample: true },
  { column: 'action', hasExample: true },
  { column: 'row_data', hasExample: false },
  { column: 'changed_fields', hasExample: false },
  { column: 'statement_only', hasExample: false },
];

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
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
  readonly actionOptions: { value: AuditAction | ''; labelKey: string }[] = [
    { value: '', labelKey: 'pagesComponent.auditLogs.filters.action-all' },
    { value: 'I', labelKey: 'pagesComponent.auditLogs.filters.action-insert' },
    { value: 'U', labelKey: 'pagesComponent.auditLogs.filters.action-update' },
    { value: 'D', labelKey: 'pagesComponent.auditLogs.filters.action-delete' },
    { value: 'T', labelKey: 'pagesComponent.auditLogs.filters.action-truncate' },
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
  readonly columnHelpKeys: ColumnHelpKey[] = COLUMN_HELP_KEYS;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 120;
  }

  constructor(
    private auditService: AuditService,
    private toastr: ToastrService,
    private translate: TranslateService
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
        this.handleError(
          error,
          this.translate.instant('pagesComponent.auditLogs.messages.load-error')
        );
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
    return date.toLocaleString(this.translate.currentLang || 'es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  detailEntries(row: AuditLog): DetailEntry[] {
    const yesNo = (b: boolean) =>
      this.translate.instant(
        b ? 'pagesComponent.auditLogs.detail.yes' : 'pagesComponent.auditLogs.detail.no'
      );
    return [
      { labelKey: 'pagesComponent.auditLogs.detail.schema', value: row.schema_name ?? '-' },
      { labelKey: 'pagesComponent.auditLogs.detail.relid', value: String(row.relid ?? '-') },
      { labelKey: 'pagesComponent.auditLogs.detail.transaction-id', value: String(row.transaction_id ?? '-') },
      { labelKey: 'pagesComponent.auditLogs.detail.application', value: row.application_name ?? '-' },
      { labelKey: 'pagesComponent.auditLogs.detail.client-port', value: String(row.client_port ?? '-') },
      { labelKey: 'pagesComponent.auditLogs.detail.statement-only', value: yesNo(row.statement_only) },
      { labelKey: 'pagesComponent.auditLogs.detail.statement-ts', value: this.formatTimestamp(row.action_tstamp_stm) },
      { labelKey: 'pagesComponent.auditLogs.detail.clock-ts', value: this.formatTimestamp(row.action_tstamp_clk) },
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
