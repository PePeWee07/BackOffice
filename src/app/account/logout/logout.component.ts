import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  icons,
} from 'lucide-angular';
import { AuthenticationService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { AuthfakeauthenticationService } from '../../core/services/authfake.service';
import { CutomDropdownComponent } from '../../Component/customdropdown';

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
    private authFackservice: AuthfakeauthenticationService
  ) {}

  year = new Date().getFullYear();

  logout() {
    if (environment.defaultauth === 'firebase') {
      this.authService.logout();
    } else {
      this.authFackservice.logout();
    }
    this.router.navigate(['/account-login']);
  }
}
