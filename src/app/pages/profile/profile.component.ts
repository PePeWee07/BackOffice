import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { UserProfileService } from '../../core/services/user/user-profile.service';
import { UserModel, UserRequest } from '../../store/User/user-model';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageTitleComponent,
    LucideAngularModule,
    TranslateModule,
  ],
  templateUrl: './profile.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userProfileService = inject(UserProfileService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  readonly profileForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.maxLength(50)]),
    lastName: this.fb.nonNullable.control('', [Validators.maxLength(50)]),
    email: this.fb.nonNullable.control('', [Validators.email]),
    phoneNumber: this.fb.nonNullable.control('', [Validators.maxLength(20)]),
    address: this.fb.nonNullable.control('', [Validators.maxLength(120)]),
    dni: this.fb.nonNullable.control('', [Validators.maxLength(20)]),
    password: this.fb.nonNullable.control('', [Validators.minLength(8)]),
  });

  profile: UserModel | null = null;
  loading = false;
  saving = false;
  showPassword = false;

  private initialSnapshot = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  get isDirty(): boolean {
    return JSON.stringify(this.profileForm.getRawValue()) !== this.initialSnapshot;
  }

  loadProfile(): void {
    this.loading = true;
    this.userProfileService.getProfile().subscribe({
      next: (user) => {
        this.profile = user;
        this.profileForm.reset({
          name: user.name ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          phoneNumber: user.phoneNumber ?? '',
          address: user.address ?? '',
          dni: user.dni ?? '',
          password: '',
        });
        this.initialSnapshot = JSON.stringify(this.profileForm.getRawValue());
        this.showPassword = false;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, this.t('messages.load-error'));
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    if (!this.showPassword) {
      this.profileForm.controls.password.setValue('');
    }
  }

  discardChanges(): void {
    if (!this.profile) {
      return;
    }
    this.profileForm.reset({
      name: this.profile.name ?? '',
      lastName: this.profile.lastName ?? '',
      email: this.profile.email ?? '',
      phoneNumber: this.profile.phoneNumber ?? '',
      address: this.profile.address ?? '',
      dni: this.profile.dni ?? '',
      password: '',
    });
    this.showPassword = false;
    this.initialSnapshot = JSON.stringify(this.profileForm.getRawValue());
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      if (this.profileForm.controls.email.errors?.['email']) {
        this.toastr.info(this.t('messages.email-invalid'));
      }
      return;
    }

    const raw = this.profileForm.getRawValue();
    const initial = JSON.parse(this.initialSnapshot) as typeof raw;

    // Solo enviamos los campos que cambiaron (PATCH semantico).
    const payload: UserRequest = {};
    const fields: (keyof typeof raw)[] = [
      'name',
      'lastName',
      'email',
      'phoneNumber',
      'address',
      'dni',
    ];
    fields.forEach((key) => {
      if (raw[key] !== initial[key]) {
        (payload as Record<string, unknown>)[key] = raw[key];
      }
    });

    // Password solo si el usuario lo escribio explicitamente.
    if (this.showPassword && raw.password && raw.password.length >= 8) {
      payload.password = raw.password;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    this.saving = true;
    this.userProfileService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.profileForm.reset({
          name: updated.name ?? '',
          lastName: updated.lastName ?? '',
          email: updated.email ?? '',
          phoneNumber: updated.phoneNumber ?? '',
          address: updated.address ?? '',
          dni: updated.dni ?? '',
          password: '',
        });
        this.initialSnapshot = JSON.stringify(this.profileForm.getRawValue());
        this.showPassword = false;
        this.saving = false;
        this.toastr.success(this.t('messages.save-success'));
      },
      error: (error) => {
        this.saving = false;
        this.handleError(error, this.t('messages.save-error'));
      },
    });
  }

  formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(this.translate.currentLang || 'es', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(`pagesComponent.profile.${key}`, params);
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
