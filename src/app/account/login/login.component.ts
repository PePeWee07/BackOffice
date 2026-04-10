import { Component, OnInit } from '@angular/core';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthenticationService } from '../../core/services/auth/auth.service';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { CutomDropdownComponent } from '../../Component/customdropdown';
import { ToastrService } from 'ngx-toastr';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CutomDropdownComponent,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styles: ``,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class LoginComponent implements OnInit {
  year: number = new Date().getFullYear();
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType = false;
  loading = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tokenStorage: TokenStorageService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      this.router.navigate(['/']);
      return;
    }

    this.loginForm = this.formBuilder.group({
      email: ['pepewee07@gmail.com', [Validators.required, Validators.email]],
      password: ['1234', [Validators.required]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    if (this.loading) return;
    this.loading = true;

    const email = this.f['email'].value;
    const password = this.f['password'].value;

    this.authenticationService
      .getCsrfToken()
      .pipe(
        switchMap(() => this.authenticationService.login(email, password)),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          const resp: ApiErrorModel = err.error;
          const mensaje =
            resp?.message || resp?.errors?.[0]?.message || 'Error inesperado';
          const titulo = resp?.errors?.[0]?.error || 'ERROR';

          this.toastr.error(mensaje, titulo, {});
        },
      });
  }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
