import { Route } from '@angular/router';
import { IndexComponent } from './dashboard/index/index.component';
import { ChatComponent } from './apps/catia/chat/chat.component';
import { CatiaToolsComponent } from './apps/catia/tools/tools.component';
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
import { UsersGridComponent } from './user/user-table/users-grid.component';
import { RolesPermissionsComponent } from './user/role-permissions/roles-permissions.component';
import { RoutePermissionsComponent } from './user/route-permissions/route-permissions.component';
import { AuditLogsComponent } from './admin/audit-logs.component';
import { RefreshTokensComponent } from './admin/refresh-tokens.component';
import { ProfileComponent } from './profile/profile.component';
import { CalendarComponent } from './calendar/calendar/calendar.component';

import { MonthGridComponent } from './calendar/month-grid/month-grid.component';
import { MultiMonthStackComponent } from './calendar/multi-month-stack/multi-month-stack.component';

export const PAGE_ROUTES: Route[] = [
  { path: '', component: IndexComponent },
  { path: 'apps-chat', component: ChatComponent },
  { path: 'apps-catia-tools', component: CatiaToolsComponent },
  { path: 'apps-calendar', component: CalendarComponent },
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
  { path: 'apps-users-grid', component: UsersGridComponent },
  { path: 'apps-users-role', component: RolesPermissionsComponent },
  { path: 'apps-route-permissions', component: RoutePermissionsComponent },
  { path: 'apps-audit-logs', component: AuditLogsComponent },
  { path: 'apps-refresh-tokens', component: RefreshTokensComponent },
  { path: 'profile', component: ProfileComponent },
];
