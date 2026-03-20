import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { AuthenticationService } from '../../core/services/auth/auth.service';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  templateUrl: './logout.component.html',
  styles: ``,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class LogoutComponent {
  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private toastr: ToastrService
  ) {}

  year = new Date().getFullYear();

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.tokenStorage.signOut();
        this.authService.currentUserSubject.next(null);
        this.router.navigate(['/account-login']);
      },
      error: (err) => {
        const resp: ApiErrorModel = err.error;
        const mensaje =
          resp?.message || resp?.errors?.[0]?.message || 'Error inesperado';
        const titulo = resp.errors?.[0].error || 'ERROR';

        this.toastr.error(mensaje, titulo, {
          // toastClass: '',
        });
      },
    });
  }
}
