import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';

import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { RoutePermissionService } from '../../core/services/administration/route-permission.service';
import { LogoutService } from '../../core/services/auth/logout.service';
import { JwtToken } from '../../store/Authentication/jwt.model';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './unauthorized.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly routePermissionService = inject(RoutePermissionService);
  private readonly logoutService = inject(LogoutService);

  readonly attemptedPath: string = this.route.snapshot.queryParamMap.get('from') ?? '';

  readonly userRoles: string[] = this.extractUserRoles();
  readonly requiredRoles: string[] = this.lookupRequiredRoles();
  readonly userEmail: string | null = this.extractUserEmail();

  readonly supportEmail = 'soportetic@ucacue.edu.ec';

  goHome(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.logoutService.confirmAndLogout();
  }

  private extractUserRoles(): string[] {
    const tokenStr = this.tokenStorage.getToken();
    if (!tokenStr) {
      return [];
    }
    const token: JwtToken | null = this.tokenStorage.getDataToken(tokenStr);
    if (!token?.authorities) {
      return [];
    }
    return token.authorities
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.startsWith('ROLE_'));
  }

  private extractUserEmail(): string | null {
    const tokenStr = this.tokenStorage.getToken();
    if (!tokenStr) {
      return null;
    }
    const token = this.tokenStorage.getDataToken(tokenStr);
    return token?.sub ?? null;
  }

  private lookupRequiredRoles(): string[] {
    const required = this.routePermissionService.getRolesForPath(this.attemptedPath);
    if (!required) {
      return [];
    }
    return required.map((role) => (role.startsWith('ROLE_') ? role : `ROLE_${role}`));
  }
}
