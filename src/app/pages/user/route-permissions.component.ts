import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { RoleService } from '../../core/services/administration/role.service';
import { RoutePermissionService } from '../../core/services/administration/route-permission.service';
import { ROUTE_CATALOG } from '../../core/services/administration/route-catalog';
import {
  RoutePermissionResponse,
  RoleResponse,
} from '../../store/User/user-model';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

interface RoutePermissionRow {
  id: number;
  path: string;
  description: string | null | undefined;
  selectedRoleIds: Set<number>;
  initialRoleIds: Set<number>;
  saving: boolean;
}

@Component({
  selector: 'app-route-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './route-permissions.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class RoutePermissionsComponent implements OnInit {
  roles: RoleResponse[] = [];
  rows: RoutePermissionRow[] = [];
  loading = false;
  syncing = false;
  savingAll = false;
  filter = '';

  selectedRowIds = new Set<number>();
  bulkRoleId: number | null = null;

  constructor(
    private routePermissionService: RoutePermissionService,
    private roleService: RoleService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRows(): RoutePermissionRow[] {
    const query = this.filter.trim().toLowerCase();
    if (!query) {
      return this.rows;
    }
    return this.rows.filter((row) => row.path.toLowerCase().includes(query));
  }

  get dirtyRows(): RoutePermissionRow[] {
    return this.rows.filter((row) => this.isDirty(row));
  }

  get allFilteredSelected(): boolean {
    const filtered = this.filteredRows;
    return filtered.length > 0 && filtered.every((row) => this.selectedRowIds.has(row.id));
  }

  get someFilteredSelected(): boolean {
    const filtered = this.filteredRows;
    return (
      filtered.some((row) => this.selectedRowIds.has(row.id)) &&
      !this.allFilteredSelected
    );
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      roles: this.roleService.getRoles(),
      routes: this.routePermissionService.load(true),
    }).subscribe({
      next: ({ roles, routes }) => {
        this.roles = roles;
        this.rows = this.buildRows(routes);
        this.bulkRoleId = roles.length ? roles[0].id : null;
        this.selectedRowIds.clear();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleError(
          error,
          this.translate.instant('pagesComponent.routePermissions.messages.load-error')
        );
      },
    });
  }

  syncFromCatalog(): void {
    this.syncing = true;
    this.routePermissionService.sync({ paths: ROUTE_CATALOG }).subscribe({
      next: (routes) => {
        this.rows = this.buildRows(routes);
        this.selectedRowIds.clear();
        this.syncing = false;
        this.toastr.success(
          this.translate.instant('pagesComponent.routePermissions.messages.sync-success')
        );
      },
      error: (error) => {
        this.syncing = false;
        this.handleError(
          error,
          this.translate.instant('pagesComponent.routePermissions.messages.sync-error')
        );
      },
    });
  }

  toggleRole(row: RoutePermissionRow, roleId: number): void {
    if (row.selectedRoleIds.has(roleId)) {
      row.selectedRoleIds.delete(roleId);
    } else {
      row.selectedRoleIds.add(roleId);
    }
  }

  toggleRowSelection(rowId: number): void {
    if (this.selectedRowIds.has(rowId)) {
      this.selectedRowIds.delete(rowId);
    } else {
      this.selectedRowIds.add(rowId);
    }
  }

  toggleSelectAllFiltered(): void {
    const filtered = this.filteredRows;
    if (this.allFilteredSelected) {
      filtered.forEach((row) => this.selectedRowIds.delete(row.id));
    } else {
      filtered.forEach((row) => this.selectedRowIds.add(row.id));
    }
  }

  clearSelection(): void {
    this.selectedRowIds.clear();
  }

  addRoleToSelected(): void {
    if (!this.bulkRoleId || !this.selectedRowIds.size) {
      return;
    }
    this.rows
      .filter((row) => this.selectedRowIds.has(row.id))
      .forEach((row) => row.selectedRoleIds.add(this.bulkRoleId!));
  }

  removeRoleFromSelected(): void {
    if (!this.bulkRoleId || !this.selectedRowIds.size) {
      return;
    }
    this.rows
      .filter((row) => this.selectedRowIds.has(row.id))
      .forEach((row) => row.selectedRoleIds.delete(this.bulkRoleId!));
  }

  isDirty(row: RoutePermissionRow): boolean {
    if (row.selectedRoleIds.size !== row.initialRoleIds.size) {
      return true;
    }
    for (const id of row.selectedRoleIds) {
      if (!row.initialRoleIds.has(id)) {
        return true;
      }
    }
    return false;
  }

  saveRow(row: RoutePermissionRow): void {
    row.saving = true;
    this.routePermissionService
      .assignRoles(row.id, { roleIds: Array.from(row.selectedRoleIds) })
      .subscribe({
        next: (updated) => {
          this.applyServerUpdate(row, updated);
          row.saving = false;
          this.toastr.success(
            this.translate.instant('pagesComponent.routePermissions.messages.save-row-success', {
              path: row.path || '/',
            })
          );
        },
        error: (error) => {
          row.saving = false;
          this.handleError(
            error,
            this.translate.instant('pagesComponent.routePermissions.messages.save-row-error')
          );
        },
      });
  }

  saveAllDirty(): void {
    const pending = this.dirtyRows;
    if (!pending.length) {
      return;
    }

    this.savingAll = true;
    pending.forEach((row) => (row.saving = true));

    const requests = pending.map((row) =>
      this.routePermissionService.assignRoles(row.id, {
        roleIds: Array.from(row.selectedRoleIds),
      })
    );

    forkJoin(requests).subscribe({
      next: (updates) => {
        updates.forEach((updated, index) => {
          this.applyServerUpdate(pending[index], updated);
          pending[index].saving = false;
        });
        this.savingAll = false;
        this.toastr.success(
          this.translate.instant('pagesComponent.routePermissions.messages.save-all-success', {
            count: updates.length,
          })
        );
      },
      error: (error) => {
        pending.forEach((row) => (row.saving = false));
        this.savingAll = false;
        this.handleError(
          error,
          this.translate.instant('pagesComponent.routePermissions.messages.save-all-error')
        );
      },
    });
  }

  resetRow(row: RoutePermissionRow): void {
    row.selectedRoleIds = new Set(row.initialRoleIds);
  }

  resetAllDirty(): void {
    this.dirtyRows.forEach((row) => this.resetRow(row));
  }

  private applyServerUpdate(
    row: RoutePermissionRow,
    updated: RoutePermissionResponse
  ): void {
    row.initialRoleIds = new Set(updated.roleList.map((r) => r.id));
    row.selectedRoleIds = new Set(row.initialRoleIds);
  }

  private buildRows(routes: RoutePermissionResponse[]): RoutePermissionRow[] {
    return [...routes]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((route) => {
        const initial = new Set(route.roleList.map((role) => role.id));
        return {
          id: route.id,
          path: route.path,
          description: route.description,
          selectedRoleIds: new Set(initial),
          initialRoleIds: initial,
          saving: false,
        } satisfies RoutePermissionRow;
      });
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
