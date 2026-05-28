import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { AuthorityService } from '../../core/services/administration/authority.service';
import { RoleService } from '../../core/services/administration/role.service';
import {
  PermissionListResponse,
  RoleResponse,
} from '../../store/User/user-model';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './roles-permissions.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class RolesPermissionsComponent {
  private readonly validNamePattern = /^[A-Z0-9_]{1,50}$/;

  readonly roleForm = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(this.validNamePattern),
      Validators.maxLength(50),
    ]),
    permissionIds: this.fb.nonNullable.control<number[]>([]),
    newPermissionName: this.fb.nonNullable.control('', [
      Validators.pattern(this.validNamePattern),
      Validators.maxLength(50),
    ]),
  });

  roles: RoleResponse[] = [];
  permissionsCatalog: PermissionListResponse[] = [];
  draftPermissions: string[] = [];

  selectedRoleId: number | null = null;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private authorityService: AuthorityService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(`pagesComponent.rolesPermissions.${key}`, params);
  }

  ngOnInit(): void {
    this.setupInputNormalization();
    this.loadData();
  }

  get isEditMode(): boolean {
    return this.selectedRoleId !== null;
  }

  get selectedPermissionIds(): number[] {
    return this.roleForm.controls.permissionIds.value;
  }

  get selectedRole(): RoleResponse | undefined {
    return this.roles.find((role) => role.id === this.selectedRoleId);
  }

  get selectedPermissionNames(): string[] {
    const existing = this.permissionsCatalog
      .filter((permission) => this.selectedPermissionIds.includes(permission.id))
      .map((permission) => permission.name);

    return [...existing, ...this.draftPermissions];
  }

  loadData(selectRoleId?: number | null): void {
    this.loading = true;

    forkJoin({
      roles: this.roleService.getRoles(),
      permissions: this.authorityService.getPermissions(),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles = roles;
        this.permissionsCatalog = permissions;
        this.loading = false;

        if (selectRoleId) {
          const roleExists = this.roles.some((role) => role.id === selectRoleId);
          if (roleExists) {
            this.selectRole(selectRoleId);
            return;
          }
        }

        if (this.selectedRoleId) {
          const currentRoleExists = this.roles.some(
            (role) => role.id === this.selectedRoleId
          );
          if (currentRoleExists) {
            this.selectRole(this.selectedRoleId);
            return;
          }
        }

        this.startNewRole();
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, this.t('messages.load-error'));
      },
    });
  }

  startNewRole(): void {
    this.selectedRoleId = null;
    this.draftPermissions = [];
    this.roleForm.reset({
      name: '',
      permissionIds: [],
      newPermissionName: '',
    });
  }

  selectRole(roleId: number): void {
    const role = this.roles.find((item) => item.id === roleId);

    if (!role) {
      return;
    }

    this.selectedRoleId = role.id;
    this.draftPermissions = [];
    this.roleForm.reset({
      name: role.name,
      permissionIds: role.permissionList?.map((permission) => permission.id) ?? [],
      newPermissionName: '',
    });
  }

  togglePermission(permissionId: number): void {
    const currentIds = this.selectedPermissionIds;
    const exists = currentIds.includes(permissionId);
    const updatedIds = exists
      ? currentIds.filter((id) => id !== permissionId)
      : [...currentIds, permissionId];

    this.roleForm.controls.permissionIds.setValue(updatedIds);
    this.roleForm.controls.permissionIds.markAsDirty();
  }

  addDraftPermission(): void {
    const permissionName = this.normalizeIdentifier(
      this.roleForm.controls.newPermissionName.value
    );

    if (!permissionName) {
      return;
    }

    if (!this.validNamePattern.test(permissionName)) {
      this.toastr.info(this.t('messages.permission-pattern'));
      return;
    }

    const existsInCatalog = this.permissionsCatalog.some(
      (permission) => permission.name.toLowerCase() === permissionName.toLowerCase()
    );
    const existsInDrafts = this.draftPermissions.some(
      (permission) => permission.toLowerCase() === permissionName.toLowerCase()
    );

    if (existsInCatalog || existsInDrafts) {
      this.toastr.info(this.t('messages.permission-duplicate'));
      return;
    }

    this.draftPermissions = [...this.draftPermissions, permissionName];
    this.roleForm.controls.newPermissionName.setValue('');
  }

  removeDraftPermission(permissionName: string): void {
    this.draftPermissions = this.draftPermissions.filter(
      (permission) => permission !== permissionName
    );
  }

  async deletePermission(permissionId: number, permissionName: string): Promise<void> {
    const result = await Swal.fire({
      title: this.t('delete.permission-title'),
      html: `
        <div class="text-left">
          <p class="mb-2">${this.t('delete.permission-message', { name: permissionName })}</p>
          <p class="mb-3">${this.t('delete.confirmation-prompt')}</p>
        </div>
      `,
      input: 'text',
      inputLabel: this.t('delete.permission-input-label'),
      inputPlaceholder: permissionName,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('delete.confirm'),
      cancelButtonText: this.t('delete.cancel'),
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true,
      preConfirm: (value) => {
        const normalizedValue = this.normalizeIdentifier(value ?? '');

        if (normalizedValue !== permissionName) {
          Swal.showValidationMessage(this.t('delete.must-match'));
          return false;
        }

        return normalizedValue;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    this.authorityService.deletePermission(permissionId).subscribe({
      next: () => {
        this.roleForm.controls.permissionIds.setValue(
          this.selectedPermissionIds.filter((id) => id !== permissionId)
        );
        this.toastr.success(this.t('messages.permission-delete-success'));
        this.loadData(this.selectedRoleId);
      },
      error: (error) => {
        this.handleError(
          error,
          this.t('messages.permission-delete-error', { name: permissionName })
        );
      },
    });
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.toastr.info(this.t('messages.name-invalid'));
      return;
    }

    const roleName = this.normalizeIdentifier(this.roleForm.controls.name.value);
    const selectedPermissionIds = this.selectedPermissionIds;

    if (!this.validNamePattern.test(roleName)) {
      this.toastr.info(this.t('messages.name-pattern'));
      return;
    }

    if (!selectedPermissionIds.length && !this.draftPermissions.length) {
      this.toastr.info(this.t('messages.must-have-permission'));
      return;
    }

    this.saving = true;

    const createMissingPermissions$ = this.draftPermissions.length
      ? forkJoin(
          this.draftPermissions.map((permissionName) =>
            this.authorityService.createPermission({ name: permissionName })
          )
        )
      : of([]);

    const persistRole$ = createMissingPermissions$.pipe(
      switchMap((createdPermissions) => {
        const allPermissionIds = Array.from(
          new Set([
            ...selectedPermissionIds,
            ...createdPermissions.map((permission) => permission.id),
          ])
        );

        const payload = {
          name: roleName,
          permissionsIds: allPermissionIds,
        };

        return this.isEditMode
          ? this.roleService.updateRole(this.selectedRoleId!, payload)
          : this.roleService.createRole(payload);
      })
    );

    persistRole$.subscribe({
      next: (role) => {
        this.saving = false;
        this.toastr.success(
          this.isEditMode
            ? this.t('messages.update-success')
            : this.t('messages.create-success')
        );
        this.loadData(role.id);
      },
      error: (error) => {
        this.saving = false;
        this.handleError(error, this.t('messages.save-error'));
      },
    });
  }

  async deleteRole(roleId: number): Promise<void> {
    const role = this.roles.find((item) => item.id === roleId);

    if (!role) {
      return;
    }

    const result = await Swal.fire({
      title: this.t('delete.role-title'),
      html: `
        <div class="text-left">
          <p class="mb-2">${this.t('delete.role-message', { name: role.name })}</p>
          <p class="mb-3">${this.t('delete.confirmation-prompt')}</p>
        </div>
      `,
      input: 'text',
      inputLabel: this.t('delete.role-input-label'),
      inputPlaceholder: role.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.t('delete.confirm'),
      cancelButtonText: this.t('delete.cancel'),
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true,
      preConfirm: (value) => {
        const normalizedValue = this.normalizeIdentifier(value ?? '');

        if (normalizedValue !== role.name) {
          Swal.showValidationMessage(this.t('delete.must-match'));
          return false;
        }

        return normalizedValue;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    this.roleService.deleteRole(roleId).subscribe({
      next: () => {
        this.toastr.success(this.t('messages.delete-success'));

        if (this.selectedRoleId === roleId) {
          this.startNewRole();
        }

        this.loadData();
      },
      error: (error) => {
        this.handleError(error, this.t('messages.delete-error'));
      },
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

  private setupInputNormalization(): void {
    this.roleForm.controls.name.valueChanges.subscribe((value) => {
      const normalized = this.normalizeIdentifier(value);

      if (value !== normalized) {
        this.roleForm.controls.name.setValue(normalized, {
          emitEvent: false,
        });
      }
    });

    this.roleForm.controls.newPermissionName.valueChanges.subscribe((value) => {
      const normalized = this.normalizeIdentifier(value);

      if (value !== normalized) {
        this.roleForm.controls.newPermissionName.setValue(normalized, {
          emitEvent: false,
        });
      }
    });
  }

  private normalizeIdentifier(value: string): string {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
      .slice(0, 50);
  }
}
