import { TokenStorageService } from './../../core/services/auth/token-storage.service';
import { Component } from '@angular/core';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthenticationService } from '../../core/services/auth/auth.service';
import { CutomDropdownComponent } from '../../Component/customdropdown';

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
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;

  // set the current year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private tokenStorage: TokenStorageService
  ) {
    if (this.authenticationService.user) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.tokenStorage.getUser()) {
      this.router.navigate(['/']);
    }
    /**
     * Form Validatyion
     */
    this.loginForm = this.formBuilder.group({
      email: ['pepewee07@gmail.com', [Validators.required, Validators.email]],
      password: ['1234', [Validators.required]],
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Form submit
   */
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
      error: (err) => {
        console.log('LOGIN ERROR', err);
        this.loading = false;
      },
    });
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
