import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'employees', loadComponent: () => import('./features/employees/employee-list.component').then(m => m.EmployeeListComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'departments', loadComponent: () => import('./features/departments/department-list.component').then(m => m.DepartmentListComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'positions', loadComponent: () => import('./features/positions/position-list.component').then(m => m.PositionListComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'leaves', loadComponent: () => import('./features/leaves/leave-list.component').then(m => m.LeaveListComponent) },
      { path: 'leaves/balances', loadComponent: () => import('./features/leaves/leave-balances.component').then(m => m.LeaveBalancesComponent) },
      { path: 'attendance', loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'attendance/device-logs', loadComponent: () => import('./features/attendance/device-logs.component').then(m => m.DeviceLogsComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'payroll/structures', loadComponent: () => import('./features/payroll/salary-structure.component').then(m => m.SalaryStructureComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'payroll/run', loadComponent: () => import('./features/payroll/payroll-run.component').then(m => m.PayrollRunComponent), canActivate: [roleGuard(['HR'])] },
      { path: 'payroll/slips', loadComponent: () => import('./features/payroll/payslip-list.component').then(m => m.PayslipListComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
