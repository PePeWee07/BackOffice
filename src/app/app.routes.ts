import { Route, Routes } from '@angular/router';
import { LayoutComponent } from './layouts/layout/layout.component';

import { AuthGuard } from './core/guards/auth.guard';

import { LogoutComponent } from './account/logout/logout.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { ResetPassComponent } from './account/reset-pass/reset-pass-modern.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    loadChildren: () =>
      import('./pages/pages.route').then((mod) => mod.PAGE_ROUTES),
    canActivate: [AuthGuard],
  },

  // Offical auth
  { path: 'account-login', component: LoginComponent },
  { path: 'account-register', component: RegisterComponent },
  { path: 'account-logout', component: LogoutComponent },
  { path: 'account-reset-password', component: ResetPassComponent },

];
