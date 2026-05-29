import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthenticationService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { ApiErrorModel } from '../../../store/Authentication/apiError.model';

/**
 * Confirma con un SweetAlert antes de cerrar la sesion del usuario. Centraliza
 * el dialogo, el call al endpoint /log-out con su CSRF previo, el toast de
 * exito/error y la navegacion al login. Cualquier punto del back-office que
 * necesite cerrar sesion debe pasar por aqui.
 */
@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);

  async confirmAndLogout(): Promise<void> {
    const t = (key: string) => this.translate.instant(`coomon.modal-logout.${key}`);

    const result = await Swal.fire({
      title: t('title'),
      text: t('message'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: t('loading'),
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    this.authService
      .getCsrfToken()
      .pipe(switchMap(() => this.authService.logout()))
      .subscribe({
        next: () => {
          Swal.close();
          this.toastr.success(t('success'));
          this.router.navigate(['/account-login']);
        },
        error: (err) => {
          Swal.close();
          // Aunque la API falle, limpiamos el token local para evitar dejar al
          // usuario en un estado inconsistente. Despues mostramos el error real.
          this.tokenStorage.signOut();
          const resp: ApiErrorModel | undefined = err?.error;
          const message =
            resp?.errors?.[0]?.message || resp?.message || t('error');
          const title = resp?.errors?.[0]?.error || 'ERROR';
          this.toastr.error(message, title);
          this.router.navigate(['/account-login']);
        },
      });
  }
}
