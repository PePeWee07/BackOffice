import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { AuthenticationService } from '../../core/services/auth.service';

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
    private authService: AuthenticationService
  ) {}

  year = new Date().getFullYear();

  logout() {
    this.authService.logout();
    this.router.navigate(['/account-login']);
  }
}
