import { Route } from '@angular/router';
import { IndexComponent } from './dashboard/index/index.component';
import { AnalyticsComponent } from './dashboard/analytics/analytics.component';
import { HrComponent } from './dashboard/hr/hr.component';
import { ChatComponent } from './apps/chat/chat.component';
import { ListComponent } from './ecommerce/products/list/list.component';
import { GridComponent } from './ecommerce/products/grid/grid.component';
import { OverviewComponent } from './ecommerce/products/overview/overview.component';
import { CreateComponent } from './ecommerce/products/create/create.component';
import { CartComponent } from './ecommerce/cart/cart.component';
import { CheckoutComponent } from './ecommerce/checkout/checkout.component';
import { OrdersComponent } from './ecommerce/orders/orders.component';
import { OrderOverviewComponent } from './ecommerce/order-overview/order-overview.component';
import { SellersComponent } from './ecommerce/sellers/sellers.component';
import { EmployeeComponent } from './hr/employee/employee.component';
import { HolidaysComponent } from './hr/holidays/holidays.component';
import { LeaveEmployeeComponent } from './hr/leaves/leave-employee/leave-employee.component';
import { CreateLeaveEmployeeComponent } from './hr/leaves/create-leave-employee/create-leave-employee.component';
import { LeaveComponent } from './hr/leaves/leave/leave.component';
import { CreateLeaveComponent } from './hr/leaves/create-leave/create-leave.component';
import { AttendanceHrComponent } from './hr/attendance/attendance-hr/attendance-hr.component';
import { AttendanceMainComponent } from './hr/attendance/attendance-main/attendance-main.component';
import { DepartmentComponent } from './hr/department/department.component';
import { EstimatesComponent } from './hr/sales/estimates/estimates.component';
import { PaymentsComponent } from './hr/sales/payments/payments.component';
import { ExpensesComponent } from './hr/sales/expenses/expenses.component';

import { EmployeeSalaryComponent } from './hr/payroll/employee-salary/employee-salary.component';
import { PayslipComponent } from './hr/payroll/payslip/payslip.component';
import { CreatePayslipComponent } from './hr/payroll/create-payslip/create-payslip.component';
import { ListViewComponent } from './invoice/list-view/list-view.component';
import { AddNewComponent } from './invoice/add-new/add-new.component';
import { InvoiceOverviewComponent } from './invoice/invoice-overview/invoice-overview.component';
import { UsersListComponent } from './user/users-list/users-list.component';
import { UsersGridComponent } from './user/users-grid/users-grid.component';
import { CalendarComponent } from './calendar/calendar/calendar.component';
import { AccountComponent } from './extrapages/account/account.component';

import { AccountSettingsComponent } from './extrapages/account-settings/account-settings.component';
import { ContactUsComponent } from './extrapages/contact-us/contact-us.component';

import { MonthGridComponent } from './calendar/month-grid/month-grid.component';
import { MultiMonthStackComponent } from './calendar/multi-month-stack/multi-month-stack.component';
import { Error404Component } from './extrapages/errorpages/error404/error404.component';
import { OfflineComponent } from './extrapages/errorpages/offline/offline.component';
import { MaintenanceComponent } from './extrapages/maintenance/maintenance.component';
import { AuthGuard } from '../core/guards/auth.guard';

export const PAGE_ROUTES: Route[] = [
  {
    path: '',
    component: IndexComponent,
  },
  {
    path: 'dashboards-analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['ROLE_ADMIN'],
    },
  },
  { path: 'dashboards-hr', component: HrComponent },
  { path: 'apps-chat', component: ChatComponent },
  {
    path: 'apps-calendar',
    component: CalendarComponent,
  },
  { path: 'apps-calendar-month-grid', component: MonthGridComponent },
  {
    path: 'apps-calendar-multi-month-stack',
    component: MultiMonthStackComponent,
  },
  { path: 'product-list', component: ListComponent },
  { path: 'product-grid', component: GridComponent },
  { path: 'product-overview', component: OverviewComponent },
  { path: 'product-create', component: CreateComponent },
  { path: 'ecommerce-cart', component: CartComponent },
  { path: 'ecommerce-checkout', component: CheckoutComponent },
  { path: 'ecommerce-order', component: OrdersComponent },
  { path: 'ecommerce-order-overview', component: OrderOverviewComponent },
  { path: 'ecommerce-sellers', component: SellersComponent },
  { path: 'hr-employee', component: EmployeeComponent },
  { path: 'hr-holidays', component: HolidaysComponent },
  { path: 'hr-leave-employee', component: LeaveEmployeeComponent },
  { path: 'hr-create-leave-employee', component: CreateLeaveEmployeeComponent },
  { path: 'hr-leave', component: LeaveComponent },
  { path: 'hr-create-leave', component: CreateLeaveComponent },
  { path: 'hr-attendance', component: AttendanceHrComponent },
  { path: 'hr-attendance-main', component: AttendanceMainComponent },
  { path: 'hr-department', component: DepartmentComponent },
  { path: 'hr-sales-estimates', component: EstimatesComponent },
  { path: 'hr-sales-payments', component: PaymentsComponent },
  { path: 'hr-sales-expenses', component: ExpensesComponent },
  { path: 'hr-payroll-employee-salary', component: EmployeeSalaryComponent },
  { path: 'hr-payroll-payslip', component: PayslipComponent },
  { path: 'hr-payroll-create-payslip', component: CreatePayslipComponent },
  { path: 'apps-invoice-list', component: ListViewComponent },
  { path: 'apps-invoice-add-new', component: AddNewComponent },
  { path: 'apps-invoice-overview', component: InvoiceOverviewComponent },
  { path: 'apps-users-list', component: UsersListComponent },
  {
    path: 'apps-users-grid',
    component: UsersGridComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['ROLE_ADMIN'],
    },
  },

  // extrapages
  { path: 'pages-account', component: AccountComponent },
  { path: 'pages-account-settings', component: AccountSettingsComponent },
  { path: 'pages-contact-us', component: ContactUsComponent },
  { path: 'pages-maintenance', component: MaintenanceComponent },
  { path: 'pages-404', component: Error404Component },
  { path: 'pages-offline', component: OfflineComponent },
];
