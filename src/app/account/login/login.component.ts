import { TokenStorageService } from './../../core/services/auth/token-storage.service';
import { Component } from '@angular/core';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from '../../core/services/auth/auth.service';
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
export class LoginComponent {

  // set the current year
  year: number = new Date().getFullYear();
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tokenStorage: TokenStorageService,
    private toastr: ToastrService
  ) {
    if (this.authenticationService.user) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.tokenStorage.getUser()) {
      this.router.navigate(['/']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['pepewee07@gmail.com', [Validators.required, Validators.email]],
      password: ['1234', [Validators.required]],
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  loading = false;
  onSubmit() {
    if (this.tokenStorage.getToken()) {
      this.router.navigate(['/']);
      return;
    }

    if (this.loading) return; // Evita doble clic
    this.loading = true;

    this.submitted = true;
    const email = this.f['email'].value;
    const password = this.f['password'].value;

    this.authenticationService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        const resp: ApiErrorModel = err.error
        const mensaje =
          resp?.message ||
          resp?.errors?.[0]?.message ||
          'Error inesperado';
        const titulo = resp.errors?.[0].error || 'ERROR';

        this.toastr.error(mensaje, titulo, {
          // toastClass: '',
        });
        this.loading = false;
      }
    });
  }


  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
