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

import { PageTitleComponent } from '../../../../shared/page-title/page-title.component';
import { CatiaToolsService } from '../../../../core/services/apis/catia/catia-tools.service';
import {
  CATIA_DEFAULT_TOOL_ROLES,
  CatiaToolPermission,
  CatiaToolPermissionsMap,
} from '../../../../core/services/apis/catia/models/catia-tools';

@Component({
  selector: 'app-catia-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './tools.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class CatiaToolsComponent implements OnInit {
  private readonly toolsService = inject(CatiaToolsService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly defaultRoles = CATIA_DEFAULT_TOOL_ROLES;

  tools: CatiaToolPermission[] = [];
  isLoading = false;
  filterText = '';

  // Mapa de depuración (tal cual se envía al modelo)
  permissionsMap: CatiaToolPermissionsMap | null = null;
  isLoadingMap = false;
  showMap = false;

  // Editor (crear / editar)
  isEditorOpen = false;
  isSaving = false;
  editingTool: CatiaToolPermission | null = null;
  editorToolName = '';
  editorRoles: string[] = [];
  editorEnabled = true;
  editorRoleInput = '';
  editorCooldownSeconds: number | null = null;

  togglingTool: string | null = null;
  deletingTool: string | null = null;
  isRestoring = false;

  ngOnInit(): void {
    this.loadTools();
  }

  get filteredTools(): CatiaToolPermission[] {
    const term = this.filterText.trim().toLowerCase();

    if (!term) {
      return this.tools;
    }

    return this.tools.filter(
      (tool) =>
        tool.toolName.toLowerCase().includes(term) ||
        (tool.allowedRoles ?? []).some((role) =>
          role.toLowerCase().includes(term)
        )
    );
  }

  get enabledCount(): number {
    return this.tools.filter((tool) => tool.enabled).length;
  }

  get disabledCount(): number {
    return this.tools.length - this.enabledCount;
  }

  // Roles sugeridos: defaults + los ya usados en otras tools, sin los ya elegidos.
  get suggestedRoles(): string[] {
    const known = new Set<string>(this.defaultRoles);

    this.tools.forEach((tool) =>
      (tool.allowedRoles ?? []).forEach((role) => known.add(role))
    );

    return [...known]
      .filter((role) => !this.editorRoles.includes(role))
      .sort();
  }

  get permissionsMapJson(): string {
    return this.permissionsMap
      ? JSON.stringify(this.permissionsMap, null, 2)
      : '';
  }

  loadTools(): void {
    this.isLoading = true;

    this.toolsService.listToolPermissions().subscribe({
      next: (tools) => {
        this.tools = this.sortTools(tools);
        this.isLoading = false;

        if (this.showMap) {
          this.loadMap();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toastr.error(this.extractError(err, this.t('messages.load-error')));
        console.error('Error tools:', err);
      },
    });
  }

  toggleMapView(): void {
    this.showMap = !this.showMap;

    if (this.showMap && !this.permissionsMap) {
      this.loadMap();
    }
  }

  loadMap(): void {
    this.isLoadingMap = true;

    this.toolsService.getToolPermissionsMap().subscribe({
      next: (map) => {
        this.permissionsMap = map;
        this.isLoadingMap = false;
      },
      error: (err: any) => {
        this.isLoadingMap = false;
        this.toastr.error(this.extractError(err, this.t('messages.map-error')));
        console.error('Error map:', err);
      },
    });
  }

  openCreateEditor(): void {
    this.editingTool = null;
    this.editorToolName = '';
    this.editorRoles = [];
    this.editorEnabled = true;
    this.editorRoleInput = '';
    this.editorCooldownSeconds = null;
    this.isEditorOpen = true;
  }

  openEditEditor(tool: CatiaToolPermission): void {
    this.editingTool = tool;
    this.editorToolName = tool.toolName;
    this.editorRoles = [...(tool.allowedRoles ?? [])];
    this.editorEnabled = tool.enabled;
    this.editorRoleInput = '';
    this.editorCooldownSeconds = tool.cooldownSeconds ?? null;
    this.isEditorOpen = true;
  }

  closeEditor(): void {
    if (this.isSaving) {
      return;
    }

    this.isEditorOpen = false;
    this.editingTool = null;
  }

  addEditorRole(role: string): void {
    const sanitized = role.trim().toUpperCase();

    if (!sanitized) {
      return;
    }

    if (!this.editorRoles.includes(sanitized)) {
      this.editorRoles = [...this.editorRoles, sanitized];
    }

    this.editorRoleInput = '';
  }

  removeEditorRole(role: string): void {
    this.editorRoles = this.editorRoles.filter((item) => item !== role);
  }

  saveEditor(): void {
    const toolName = this.editorToolName.trim();

    if (!toolName) {
      this.toastr.info(this.t('messages.name-required'));
      return;
    }

    if (!this.editorRoles.length) {
      this.toastr.info(this.t('messages.roles-required'));
      return;
    }

    if (this.isSaving) {
      return;
    }

    const cooldown = this.normalizeCooldown(this.editorCooldownSeconds);

    if (cooldown !== null && cooldown < 0) {
      this.toastr.info(this.t('messages.cooldown-invalid'));
      return;
    }

    this.isSaving = true;

    this.toolsService
      .upsertToolPermission(toolName, {
        allowedRoles: this.editorRoles,
        enabled: this.editorEnabled,
        cooldownSeconds: cooldown,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditorOpen = false;
          this.editingTool = null;
          this.toastr.success(this.t('messages.save-success', { tool: toolName }));
          this.loadTools();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.toastr.error(
            this.extractError(err, this.t('messages.save-error', { tool: toolName }))
          );
          console.error('Error upsert tool:', err);
        },
      });
  }

  toggleEnabled(tool: CatiaToolPermission): void {
    if (this.togglingTool) {
      return;
    }

    const target = !tool.enabled;
    this.togglingTool = tool.toolName;

    this.toolsService.setToolPermissionEnabled(tool.toolName, target).subscribe({
      next: (updated) => {
        this.togglingTool = null;
        tool.enabled = updated?.enabled ?? target;
        this.toastr.success(
          this.t(tool.enabled ? 'messages.toggle-on' : 'messages.toggle-off', {
            tool: tool.toolName,
          })
        );

        if (this.showMap) {
          this.loadMap();
        }
      },
      error: (err: any) => {
        this.togglingTool = null;
        this.toastr.error(
          this.extractError(err, this.t('messages.toggle-error'))
        );
        console.error('Error toggle tool:', err);
      },
    });
  }

  async deleteTool(tool: CatiaToolPermission): Promise<void> {
    const result = await Swal.fire({
      title: this.t('messages.delete-title', { tool: tool.toolName }),
      text: this.t('messages.delete-text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('messages.delete-confirm'),
      cancelButtonText: this.t('messages.cancel'),
      confirmButtonColor: '#d33',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.deletingTool = tool.toolName;

    this.toolsService.deleteToolPermission(tool.toolName).subscribe({
      next: () => {
        this.deletingTool = null;
        this.toastr.success(
          this.t('messages.delete-success', { tool: tool.toolName })
        );
        this.loadTools();
      },
      error: (err: any) => {
        this.deletingTool = null;
        this.toastr.error(
          this.extractError(err, this.t('messages.delete-error'))
        );
        console.error('Error delete tool:', err);
      },
    });
  }

  async restoreDefaults(): Promise<void> {
    const result = await Swal.fire({
      title: this.t('messages.restore-title'),
      text: this.t('messages.restore-text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('messages.restore-confirm'),
      cancelButtonText: this.t('messages.cancel'),
    });

    if (!result.isConfirmed) {
      return;
    }

    this.isRestoring = true;

    this.toolsService.restoreToolPermissionDefaults().subscribe({
      next: (tools) => {
        this.isRestoring = false;
        this.tools = this.sortTools(tools);
        this.toastr.success(this.t('messages.restore-success'));

        if (this.showMap) {
          this.loadMap();
        }
      },
      error: (err: any) => {
        this.isRestoring = false;
        this.toastr.error(
          this.extractError(err, this.t('messages.restore-error'))
        );
        console.error('Error restore tools:', err);
      },
    });
  }

  // Convierte segundos a un texto legible: 700 -> "11 min 40 s".
  // Devuelve la clave 'sin enfriamiento' para 0/null/valores inválidos.
  formatCooldown(seconds?: number | null): string {
    const total = this.normalizeCooldown(seconds);

    if (total === null || total <= 0) {
      return this.t('cooldown.none');
    }

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    const parts: string[] = [];

    if (days) {
      parts.push(`${days} ${this.t('cooldown.units.d')}`);
    }

    if (hours) {
      parts.push(`${hours} ${this.t('cooldown.units.h')}`);
    }

    if (minutes) {
      parts.push(`${minutes} ${this.t('cooldown.units.m')}`);
    }

    if (secs) {
      parts.push(`${secs} ${this.t('cooldown.units.s')}`);
    }

    return parts.join(' ');
  }

  hasCooldown(tool: CatiaToolPermission): boolean {
    const value = this.normalizeCooldown(tool.cooldownSeconds);
    return value !== null && value > 0;
  }

  private normalizeCooldown(seconds?: number | null): number | null {
    if (seconds === null || seconds === undefined || `${seconds}` === '') {
      return null;
    }

    const value = Math.floor(Number(seconds));

    return Number.isNaN(value) ? null : value;
  }

  private sortTools(tools?: CatiaToolPermission[] | null): CatiaToolPermission[] {
    return [...(tools ?? [])].sort((a, b) =>
      a.toolName.localeCompare(b.toolName)
    );
  }

  private extractError(err: any, fallback: string): string {
    return (
      err?.error?.errors?.[0]?.message ||
      err?.error?.message ||
      (err?.status === 403 ? this.t('messages.forbidden') : fallback)
    );
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(
      `pagesComponent.apps.catia.tools.${key}`,
      params
    );
  }
}
