import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import Swal from 'sweetalert2';

import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { RefreshTokenAdminService } from '../../core/services/administration/refresh-token-admin.service';
import {
  RefreshToken,
  RefreshTokenPage,
  RefreshTokenQuery,
} from '../../store/Token/refresh-token-model';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

type TriState = '' | 'true' | 'false';

@Component({
  selector: 'app-refresh-tokens',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './refresh-tokens.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class RefreshTokensComponent implements OnInit {
  private readonly service = inject(RefreshTokenAdminService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly pageSizeOptions = [10, 25, 50, 100];

  filters: {
    userId: number | null;
    email: string;
    jti: string;
    revoked: TriState;
    expired: TriState;
    size: number;
  } = {
    userId: null,
    email: '',
    jti: '',
    revoked: '',
    expired: '',
    size: 25,
  };

  rows: RefreshToken[] = [];
  page = 0;
  size = 25;
  totalElements = 0;
  totalPages = 0;
  numberOfElements = 0;

  // Estadísticas del set actual (no del global; el backend no lo expone)
  countExpired = 0;
  countActive = 0;

  loading = false;
  deletingIds = new Set<number>();

  ngOnInit(): void {
    this.loadPage(0);
  }

  get pageWindow(): number[] {
    if (this.totalPages <= 1) return [0];
    const window = 5;
    const start = Math.max(0, Math.min(this.page - 2, this.totalPages - window));
    const end = Math.min(this.totalPages, start + window);
    const pages: number[] = [];
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  }

  loadPage(targetPage: number): void {
    this.loading = true;
    const query: RefreshTokenQuery = {
      page: targetPage,
      size: this.filters.size,
    };
    if (this.filters.userId != null) query.userId = this.filters.userId;
    if (this.filters.email.trim()) query.email = this.filters.email.trim();
    if (this.filters.jti.trim()) query.jti = this.filters.jti.trim();
    if (this.filters.revoked) query.revoked = this.filters.revoked === 'true';
    if (this.filters.expired) query.expired = this.filters.expired === 'true';

    this.service.getPaged(query).subscribe({
      next: (response: RefreshTokenPage) => {
        this.rows = response.content;
        this.page = response.number;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.numberOfElements = response.numberOfElements;
        this.countExpired = this.rows.filter((r) => r.expired).length;
        this.countActive = this.rows.filter((r) => !r.expired && !r.revoked).length;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, this.t('messages.load-error'));
      },
    });
  }

  applyFilters(): void {
    this.loadPage(0);
  }

  clearFilters(): void {
    this.filters = {
      userId: null,
      email: '',
      jti: '',
      revoked: '',
      expired: '',
      size: this.filters.size,
    };
    this.loadPage(0);
  }

  changePageSize(): void {
    this.loadPage(0);
  }

  goToPage(target: number): void {
    if (target < 0 || target >= this.totalPages || target === this.page) return;
    this.loadPage(target);
  }

  async deleteOne(row: RefreshToken): Promise<void> {
    const result = await Swal.fire({
      title: this.t('delete.title-row'),
      text: this.t('delete.message-row'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('delete.confirm'),
      cancelButtonText: this.t('delete.cancel'),
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;

    this.deletingIds.add(row.id);
    this.service.deleteById(row.id).subscribe({
      next: () => {
        this.deletingIds.delete(row.id);
        this.toastr.success(this.t('delete.success-row'));
        this.loadPage(this.page);
      },
      error: (err) => {
        this.deletingIds.delete(row.id);
        this.handleError(err, this.t('delete.error'));
      },
    });
  }

  async deleteAllOfUser(row: RefreshToken): Promise<void> {
    if (row.userId == null) return;
    const result = await Swal.fire({
      title: this.t('delete.title-user'),
      html: this.translate.instant('pagesComponent.refreshTokens.delete.message-user', {
        email: row.userEmail ?? row.userId,
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('delete.confirm'),
      cancelButtonText: this.t('delete.cancel'),
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;

    this.service.deleteAllByUserId(row.userId).subscribe({
      next: (resp) => {
        this.toastr.success(
          this.translate.instant('pagesComponent.refreshTokens.delete.success-user', {
            count: resp.deleted,
          })
        );
        this.loadPage(this.page);
      },
      error: (err) => this.handleError(err, this.t('delete.error')),
    });
  }

  formatTimestamp(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString(this.translate.currentLang || 'es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  shortJti(jti: string): string {
    if (!jti) return '';
    if (jti.length <= 16) return jti;
    return `${jti.slice(0, 8)}…${jti.slice(-8)}`;
  }

  statusBadgeClass(row: RefreshToken): string {
    if (row.revoked)
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40';
    if (row.expired)
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
  }

  statusKey(row: RefreshToken): string {
    if (row.revoked) return 'pagesComponent.refreshTokens.table.status-revoked';
    if (row.expired) return 'pagesComponent.refreshTokens.table.status-expired';
    return 'pagesComponent.refreshTokens.table.status-active';
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(`pagesComponent.refreshTokens.${key}`, params);
  }

  private handleError(error: unknown, fallback: string): void {
    const apiError = error as { error?: ApiErrorModel };
    const response = apiError?.error;
    const message =
      response?.errors?.[0]?.message || response?.message || fallback;
    const title = response?.errors?.[0]?.error || 'ERROR';
    this.toastr.error(message, title);
  }
}
