import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { LeaveService } from '../../core/services/leave.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { PayrollService } from '../../core/services/payroll.service';
import {
  Employee,
  Department,
  LeaveRequest,
  EmployeeLeaveRequest,
  LeaveBalance,
  TardinessSummary,
  AttendanceRecord
} from '../../core/util/models';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="dashboard-page" [dir]="ts.isRtl() ? 'rtl' : 'ltr'">
      <!-- Page Header -->
      <div class="hr-page-header mb-4">
        <div class="header-content">
          <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h2 class="header-title mb-0">
              <span>{{ ts.t().dashboard?.welcomeBack || (ts.isRtl() ? 'مرحباً بعودتك' : 'Welcome back') }}،</span>
              <bdi class="fw-bold">{{ userName() }}</bdi>
            </h2>
            <span class="hr-badge" [ngClass]="isHR() ? 'badge-info' : 'badge-success'">
              {{ userRole() }}
            </span>
          </div>
          <p class="header-subtitle mb-0 d-flex align-items-center gap-2 flex-wrap">
            <span class="d-inline-flex align-items-center gap-1">
              <i class="fas fa-calendar-day text-primary"></i>
              <bdi>{{ formattedDate() }}</bdi>
            </span>
            <span class="text-muted opacity-50">&middot;</span>
            <span>{{ ts.t().dashboard?.realTimeTelemetry || (ts.isRtl() ? 'بيانات القوى العاملة المباشرة' : 'Real-time workforce telemetry') }}</span>
          </p>
        </div>

        <!-- Quick Actions (HR) -->
        <div *ngIf="isHR()" class="header-actions">
          <a routerLink="/payroll/run" class="btn btn-outline-primary d-inline-flex align-items-center gap-2">
            <i class="fas fa-play"></i>
            <span>{{ ts.t().common?.runPayroll || ts.t()?.dashboard?.runPayroll || (ts.isRtl() ? 'إجراء الرواتب' : 'Run Payroll') }}</span>
          </a>
          <a routerLink="/employees" class="btn btn-primary d-inline-flex align-items-center gap-2">
            <i class="fas fa-user-plus"></i>
            <span>{{ ts.t().common?.manageEmployees || ts.t()?.dashboard?.manageEmployees || (ts.isRtl() ? 'إدارة الموظفين' : 'Manage Employees') }}</span>
          </a>
        </div>

        <!-- Quick Actions (Employee) -->
        <div *ngIf="!isHR()" class="header-actions">
          <a routerLink="/leaves" class="btn btn-primary d-inline-flex align-items-center gap-2">
            <i class="fas fa-paper-plane"></i>
            <span>{{ ts.t().common?.requestLeave || (ts.isRtl() ? 'طلب إجازة' : 'Request Leave') }}</span>
          </a>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- HR ADMIN DASHBOARD                                      -->
      <!-- ======================================================== -->
      <ng-container *ngIf="isHR()">
        <!-- KPI Stat Cards Row -->
        <div class="hr-stats-grid mb-4">
          <!-- Total Employees -->
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.t().dashboard?.totalEmployees || (ts.isRtl() ? 'إجمالي الموظفين' : 'Total Employees') }}</span>
              <span class="stat-value text-primary financial-num">{{ totalEmployees() }}</span>
              <span class="stat-hint text-success">
                <i class="fas fa-check-circle" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                <span>{{ ts.t().dashboard?.activeWorkforce || (ts.isRtl() ? 'القوى العاملة النشطة' : 'Active Workforce') }}</span>
              </span>
            </div>
            <div class="stat-icon icon-primary">
              <i class="fas fa-users"></i>
            </div>
          </div>

          <!-- Departments -->
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.t().dashboard?.departments || (ts.isRtl() ? 'الأقسام' : 'Departments') }}</span>
              <span class="stat-value text-info financial-num">{{ totalDepartments() }}</span>
              <span class="stat-hint text-muted">
                <i class="fas fa-layer-group" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                <span>{{ ts.t().dashboard?.activeUnits || (ts.isRtl() ? 'الوحدات النشطة' : 'Active Units') }}</span>
              </span>
            </div>
            <div class="stat-icon icon-info">
              <i class="fas fa-sitemap"></i>
            </div>
          </div>

          <!-- Pending Leaves -->
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.t().dashboard?.pendingLeaves || (ts.isRtl() ? 'الإجازات المعلقة' : 'Pending Leaves') }}</span>
              <span class="stat-value text-warning financial-num">{{ pendingLeavesCount() }}</span>
              <span class="stat-hint text-muted">
                <i class="fas fa-clock" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                <span>{{ ts.t()?.dashboard?.awaitingReview || (ts.isRtl() ? 'بانتظار المراجعة' : 'Awaiting Review') }}</span>
              </span>
            </div>
            <div class="stat-icon icon-warning">
              <i class="fas fa-calendar-alt"></i>
            </div>
          </div>

          <!-- Monthly Payroll -->
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.t().dashboard?.monthlyPayroll || (ts.isRtl() ? 'رواتب الشهر' : 'Monthly Payroll') }}</span>
              <span class="stat-value text-success financial-num">
                {{ (monthlyDisbursed() > 0 ? (monthlyDisbursed() | number:'1.0-0') + ' ' + currency.currencySymbol() : (ts.t().dashboard?.ready || (ts.isRtl() ? 'جاهز' : 'Ready'))) }}
              </span>
              <span class="stat-hint text-muted">
                <i class="fas fa-wallet" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                <span>{{ ts.t().dashboard?.currentPeriod || (ts.isRtl() ? 'الفترة الحالية' : 'Current Period') }}</span>
              </span>
            </div>
            <div class="stat-icon icon-success">
              <i class="fas fa-money-check-dollar"></i>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <!-- Pending Approvals Queue -->
          <div class="col-12 col-lg-8">
            <div class="hr-table-card h-100">
              <div class="table-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-clipboard-check text-primary"></i>
                  <span class="fw-bold">{{ ts.t().dashboard?.pendingLeaveApprovals || (ts.isRtl() ? 'موافقات الإجازات المعلقة' : 'Pending Leave Approvals') }}</span>
                  <span class="hr-badge badge-warning">{{ pendingLeaves().length }}</span>
                </div>
                <a routerLink="/leaves" class="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                  <span>{{ ts.t().common?.viewAll || (ts.isRtl() ? 'عرض الكل' : 'View All') }}</span>
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </a>
              </div>
              <div class="table-card-body p-0">
                <div *ngIf="isLoadingHR()" class="p-4 text-center">
                  <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                  <span class="text-muted small">{{ ts.isRtl() ? 'جاري التحميل...' : 'Loading...' }}</span>
                </div>

                <div *ngIf="!isLoadingHR() && pendingLeaves().length === 0" class="empty-state py-5 text-center">
                  <i class="fas fa-check-double text-success fs-1 mb-3"></i>
                  <h6 class="fw-bold">{{ ts.t().dashboard?.allCaughtUp || (ts.isRtl() ? 'تم إنجاز كل شيء' : 'All Caught Up!') }}</h6>
                  <p class="small text-muted mb-0">{{ ts.t().dashboard?.noPendingLeaves || ts.t().dashboard?.noPendingLeaveRequests || (ts.isRtl() ? 'لا توجد طلبات إجازة معلقة بحاجة لمراجعة الموارد البشرية حالياً.' : 'No pending leave requests.') }}</p>
                </div>

                <div *ngIf="!isLoadingHR() && pendingLeaves().length > 0" class="table-responsive">
                  <table class="hr-table">
                    <thead>
                      <tr>
                        <th>{{ ts.t().common?.employee || (ts.isRtl() ? 'الموظف' : 'Employee') }}</th>
                        <th>{{ ts.t().common?.type || (ts.isRtl() ? 'النوع' : 'Type') }}</th>
                        <th>{{ ts.t().common?.duration || (ts.isRtl() ? 'الفترة' : 'Duration') }}</th>
                        <th>{{ ts.t().common?.days || (ts.isRtl() ? 'الأيام' : 'Days') }}</th>
                        <th class="text-end">{{ ts.t().common?.action || (ts.isRtl() ? 'الإجراء' : 'Action') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let leave of pendingLeaves().slice(0, 5)">
                        <td>
                          <div class="fw-bold">{{ leave.employeeName }}</div>
                          <span class="text-muted small">{{ leave.departmentName }}</span>
                        </td>
                        <td>
                          <span class="hr-badge badge-neutral">{{ leave.leaveType }}</span>
                        </td>
                        <td class="small text-nowrap">
                          {{ leave.startDate | date:'mediumDate' }} 
                          <i class="fas fa-arrow-right mx-1" [ngClass]="ts.isRtl() ? 'fa-flip-horizontal' : ''"></i> 
                          {{ leave.endDate | date:'mediumDate' }}
                        </td>
                        <td>
                          <span class="hr-badge badge-info financial-num">{{ leave.totalDays }} {{ ts.isRtl() ? 'يوم' : 'd' }}</span>
                        </td>
                        <td class="text-end">
                          <div class="btn-group btn-group-sm">
                            <button
                              class="btn btn-success btn-sm"
                              [title]="ts.t().common?.approve || (ts.isRtl() ? 'قبول فوري' : 'Approve immediately')"
                              (click)="quickApprove(leave.id)">
                              <i class="fas fa-check"></i>
                            </button>
                            <a routerLink="/leaves" class="btn btn-outline-secondary btn-sm" [title]="ts.t().common?.review || (ts.isRtl() ? 'مراجعة التفاصيل' : 'Review details')">
                              <i class="fas fa-eye"></i>
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Navigation & Highlights -->
          <div class="col-12 col-lg-4">
            <div class="hr-table-card h-100 d-flex flex-column">
              <div class="table-card-header py-3">
                <span class="fw-bold d-flex align-items-center gap-2">
                  <i class="fas fa-bolt text-warning"></i>
                  <span>{{ ts.t().dashboard?.hrOpsShortcuts || (ts.isRtl() ? 'اختصارات عمليات الموارد البشرية' : 'HR Ops Shortcuts') }}</span>
                </span>
              </div>
              <div class="card-body p-3 d-flex flex-column gap-3 flex-grow-1">
                <a routerLink="/payroll/salary-structures" class="dashboard-shortcut-card">
                  <div class="shortcut-icon-box text-primary bg-primary bg-opacity-10">
                    <i class="fas fa-sliders"></i>
                  </div>
                  <div class="shortcut-content">
                    <div class="shortcut-title">{{ ts.t().dashboard?.salaryStructureDesigner || (ts.isRtl() ? 'مصمم هيكل الرواتب' : 'Salary Structure Designer') }}</div>
                    <div class="shortcut-desc">{{ ts.t().dashboard?.configureAllowances || (ts.isRtl() ? 'تهيئة البدلات، الإضافي، وقواعد الضرائب' : 'Configure allowances & tax rules') }}</div>
                  </div>
                  <i class="fas shortcut-arrow" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </a>

                <a routerLink="/attendance" class="dashboard-shortcut-card">
                  <div class="shortcut-icon-box text-warning bg-warning bg-opacity-10">
                    <i class="fas fa-user-clock"></i>
                  </div>
                  <div class="shortcut-content">
                    <div class="shortcut-title">{{ ts.t().dashboard?.departmentAttendance || (ts.isRtl() ? 'حضور القسم' : 'Department Attendance') }}</div>
                    <div class="shortcut-desc">{{ ts.t().dashboard?.dailyPunches || (ts.isRtl() ? 'تسجيل البصمة اليومية والتدقيق اليدوي' : 'Daily punches & time audit') }}</div>
                  </div>
                  <i class="fas shortcut-arrow" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </a>

                <a routerLink="/payroll/payslips" class="dashboard-shortcut-card">
                  <div class="shortcut-icon-box text-success bg-success bg-opacity-10">
                    <i class="fas fa-file-invoice-dollar"></i>
                  </div>
                  <div class="shortcut-content">
                    <div class="shortcut-title">{{ ts.t().dashboard?.monthlyPayslips || (ts.isRtl() ? 'قسائم الرواتب الشهرية' : 'Monthly Payslips') }}</div>
                    <div class="shortcut-desc">{{ ts.t().dashboard?.inspectPayslips || (ts.isRtl() ? 'استعراض وطباعة ومراجعة قسائم رواتب الموظفين' : 'Review & print monthly salary slips') }}</div>
                  </div>
                  <i class="fas shortcut-arrow" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </a>

                <div class="dashboard-callout mt-auto">
                  <i class="fas fa-info-circle"></i>
                  <div>
                    <strong>{{ ts.t().dashboard?.tardinessRuleActive || (ts.isRtl() ? 'قاعدة سماحية التأخير 60 دقيقة:' : '60-Min Tardiness Rule Active:') }}</strong>
                    <span> {{ ts.t().dashboard?.freeGraceAllowance || (ts.isRtl() ? 'تُجدد السماحية تلقائياً أول كل شهر ميلادي.' : 'Free grace allowance resets at the 1st of every month.') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ======================================================== -->
      <!-- EMPLOYEE SELF-SERVICE DASHBOARD                          -->
      <!-- ======================================================== -->
      <ng-container *ngIf="!isHR()">
        <!-- Top Telemetry Row: Tardiness + Balance Spotlight -->
        <div class="row g-4 mb-4">
          <!-- Tardiness Gauge Widget -->
          <div class="col-12 col-lg-6">
            <div class="hr-table-card h-100">
              <div class="table-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-stopwatch text-warning"></i>
                  <span class="fw-bold">{{ ts.t().dashboard?.myMonthlyTardiness || (ts.isRtl() ? 'سماحية التأخير الشهرية' : 'My Monthly Tardiness Allowance') }}</span>
                </div>
                <span class="hr-badge badge-neutral">{{ ts.t().common?.month || (ts.isRtl() ? 'شهر' : 'Month') }} {{ currentMonth }}</span>
              </div>
              <div class="card-body p-4 d-flex flex-column justify-content-between">
                <div *ngIf="isLoadingEmployee()">
                  <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                  <span class="text-muted small">{{ ts.isRtl() ? 'جاري التحميل...' : 'Loading...' }}</span>
                </div>

                <div *ngIf="!isLoadingEmployee() && tardinessSummary() as tData">
                  <div class="d-flex justify-content-between align-items-end mb-2">
                    <div>
                      <span class="fs-1 fw-bold financial-num" [ngClass]="tData.totalLateMinutes > 60 ? 'text-danger' : 'text-success'">
                        {{ tData.totalLateMinutes }}
                      </span>
                      <span class="text-muted fs-6"> / 60 {{ ts.t().dashboard?.minsUsed || (ts.isRtl() ? 'دقيقة مستهلكة' : 'mins used') }}</span>
                    </div>

                    <span *ngIf="tData.deductibleMinutes > 0" class="hr-badge badge-danger">
                      <i class="fas fa-triangle-exclamation" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ tData.deductibleMinutes }} {{ ts.t().dashboard?.minDeductible || (ts.isRtl() ? 'دقيقة خاضعة للخصم' : 'min deductible') }}
                    </span>
                    <span *ngIf="tData.deductibleMinutes === 0" class="hr-badge badge-success">
                      <i class="fas fa-shield-halved" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t().dashboard?.withinFreeAllowance || (ts.isRtl() ? 'ضمن حد السماح المجاني' : 'Within Free Allowance') }}
                    </span>
                  </div>

                  <!-- Visual Progress Bar -->
                  <div class="progress mb-3 rounded-pill bg-light" style="height: 10px;">
                    <div
                      class="progress-bar rounded-pill"
                      [ngClass]="tardinessProgressClass(tData)"
                      role="progressbar"
                      [style.width.%]="tardinessPercentage(tData)"></div>
                  </div>

                  <div class="d-flex justify-content-between text-muted small">
                    <span><i class="fas fa-history" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ tData.lateOccurrences }} {{ ts.t().dashboard?.tardyInstances || (ts.isRtl() ? 'مرات تأخير' : 'tardy instances') }}</span>
                    <span>{{ ts.t().dashboard?.allowanceFree || (ts.isRtl() ? 'السماحية: 60 دقيقة شهرياً مجاناً' : 'Allowance: 60 mins/month free') }}</span>
                  </div>
                </div>

                <div class="alert alert-light border mt-3 mb-0 small text-muted">
                  <i class="fas fa-lightbulb text-warning" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                  {{ ts.t().dashboard?.tardinessNote || (ts.isRtl() ? 'ميعاد الحضور الرسمي هو 09:00 صباحاً. يتم احتساب أي تأخير إضافي بعد استنفاذ الـ 60 دقيقة في مسير الرواتب.' : 'Official start time is 09:00 AM.') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Balance Overview -->
          <div class="col-12 col-lg-6">
            <div class="hr-table-card h-100">
              <div class="table-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-umbrella-beach text-primary"></i>
                  <span class="fw-bold">{{ ts.t().dashboard?.myLeaveBalances || (ts.isRtl() ? 'أرصدة إجازاتي' : 'My Leave Balances') }}</span>
                </div>
                <a routerLink="/leaves/balances" class="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                  <span>{{ ts.t().dashboard?.allBalances || (ts.isRtl() ? 'كافة الأرصدة' : 'All Balances') }}</span>
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </a>
              </div>
              <div class="card-body p-3">
                <div *ngIf="isLoadingEmployee()" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                  <span class="text-muted small">{{ ts.isRtl() ? 'جاري التحميل...' : 'Loading...' }}</span>
                </div>

                <div *ngIf="!isLoadingEmployee() && leaveBalances().length === 0" class="empty-state py-3 text-center">
                  <p class="small text-muted mb-0">{{ ts.t().dashboard?.noActiveLeaveQuota || (ts.isRtl() ? 'لا توجد حصص إجازات مفعلة لهذا العام.' : 'No active leave quota.') }}</p>
                </div>

                <div *ngIf="!isLoadingEmployee() && leaveBalances().length > 0" class="d-flex flex-column gap-3">
                  <div *ngFor="let b of leaveBalances()" class="p-3 border rounded-3 bg-white shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="fw-bold text-dark small">{{ b.leaveType }} {{ ts.t().common?.leave || (ts.isRtl() ? 'إجازة' : 'Leave') }}</span>
                      <span class="small bg-light px-2 py-1 rounded financial-num">
                        <strong class="text-primary">{{ b.remainingDays }}</strong> / {{ b.totalDays }} {{ ts.t().dashboard?.daysLeft || (ts.isRtl() ? 'يوم متبقي' : 'days left') }}
                      </span>
                    </div>
                    <div class="progress rounded-pill bg-light" style="height: 8px;">
                      <div
                        class="progress-bar rounded-pill"
                        [ngClass]="b.remainingDays > 5 ? 'bg-success' : (b.remainingDays > 0 ? 'bg-warning' : 'bg-danger')"
                        [style.width.%]="(b.remainingDays / b.totalDays) * 100"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Leave Requests Table -->
        <div class="hr-table-card mb-4">
          <div class="table-card-header d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-list-check text-primary"></i>
              <span class="fw-bold">{{ ts.t().dashboard?.myRecentLeaves || (ts.isRtl() ? 'طلبات الإجازة الأخيرة' : 'My Recent Leave Requests') }}</span>
            </div>
            <a routerLink="/leaves" class="btn btn-sm btn-outline-primary">
              {{ ts.t().dashboard?.submitNewRequest || (ts.isRtl() ? 'تقديم طلب جديد' : 'Submit New Request') }}
            </a>
          </div>
          <div class="table-card-body p-0">
            <div *ngIf="myRecentLeaves().length === 0" class="empty-state py-5 text-center">
              <i class="fas fa-folder-open text-muted fs-1 mb-3"></i>
              <p class="small text-muted mb-0">{{ ts.t().dashboard?.noLeaveRequestsYet || (ts.isRtl() ? 'لم تقم بتقديم أي طلبات إجازة حتى الآن.' : 'No leave requests submitted yet.') }}</p>
            </div>

            <div *ngIf="myRecentLeaves().length > 0" class="table-responsive">
              <table class="hr-table">
                <thead>
                  <tr>
                    <th>{{ ts.t().common?.type || (ts.isRtl() ? 'النوع' : 'Type') }}</th>
                    <th>{{ ts.t().common?.startDate || (ts.isRtl() ? 'تاريخ البدء' : 'Start Date') }}</th>
                    <th>{{ ts.t().common?.endDate || (ts.isRtl() ? 'تاريخ الانتهاء' : 'End Date') }}</th>
                    <th>{{ ts.t().common?.days || (ts.isRtl() ? 'الأيام' : 'Days') }}</th>
                    <th>{{ ts.t().common?.status || (ts.isRtl() ? 'الحالة' : 'Status') }}</th>
                    <th>{{ ts.t().common?.rejectionReason || (ts.isRtl() ? 'ملاحظة الرفض' : 'Rejection Reason') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of myRecentLeaves()">
                    <td><span class="hr-badge badge-neutral">{{ req.leaveType }}</span></td>
                    <td class="small">{{ req.startDate | date:'mediumDate' }}</td>
                    <td class="small">{{ req.endDate | date:'mediumDate' }}</td>
                    <td><strong class="financial-num text-primary">{{ req.totalDays }}</strong></td>
                    <td>
                      <span
                        class="hr-badge"
                        [ngClass]="{
                          'badge-warning': req.status === 'Pending',
                          'badge-success': req.status === 'Approved',
                          'badge-danger': req.status === 'Rejected'
                        }">
                        <i
                          class="fas"
                          [ngClass]="{
                            'fa-clock': req.status === 'Pending',
                            'fa-check-circle': req.status === 'Approved',
                            'fa-times-circle': req.status === 'Rejected',
                            'ms-1': ts.isRtl(),
                            'me-1': !ts.isRtl()
                          }"></i>
                        {{ req.status }}
                      </span>
                    </td>
                    <td class="small text-danger fw-semibold">
                      {{ req.rejectionNote || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-page {
      font-family: inherit;
    }

    .dashboard-shortcut-card {
      display: flex;
      align-items: center;
      gap: 0.95rem;
      padding: 0.85rem 1.05rem;
      background: var(--bg-surface-elevated, var(--bg-surface));
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);

        .shortcut-arrow {
          color: var(--primary);
          transform: translateX(var(--arrow-dir, -3px));
        }
      }

      .shortcut-icon-box {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .shortcut-content {
        flex: 1;
        min-width: 0;

        .shortcut-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.2rem;
        }

        .shortcut-desc {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }
      }

      .shortcut-arrow {
        color: var(--text-muted);
        font-size: 0.85rem;
        flex-shrink: 0;
        transition: transform 0.2s ease, color 0.2s ease;
      }
    }

    [dir="ltr"] .dashboard-shortcut-card:hover .shortcut-arrow {
      --arrow-dir: 3px;
    }

    .dashboard-callout {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      background: rgba(99, 102, 241, 0.08);
      border: 1px dashed rgba(99, 102, 241, 0.28);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.79rem;
      line-height: 1.45;
      color: var(--text-secondary);

      i {
        font-size: 1rem;
        color: var(--primary);
        margin-top: 0.15rem;
        flex-shrink: 0;
      }

      strong {
        color: var(--text-primary);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  ts = inject(TranslationService);
  currency = inject(CurrencyService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private leaveService = inject(LeaveService);
  private attendanceService = inject(AttendanceService);
  private payrollService = inject(PayrollService);
  private toastService = inject(ToastService);

  today = new Date();
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  formattedDate = computed(() => {
    const locale = this.ts.isRtl() ? 'ar-EG-u-nu-latn' : 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(this.today);
    } catch {
      return this.today.toDateString();
    }
  });

  isHR = this.authService.isHR;
  userRole = computed(() => {
    const role = this.authService.currentUser()?.role || 'Employee';
    if (role === 'HR') {
      return this.ts.t()?.common?.hrAdmin || (this.ts.isRtl() ? 'مسؤول الموارد البشرية' : 'HR Administrator');
    }
    return this.ts.t()?.common?.employee || (this.ts.isRtl() ? 'موظف' : 'Employee');
  });
  userName = computed(() => {
    const email = this.authService.currentUser()?.email;
    if (!email) return this.ts.t()?.common?.user || (this.ts.isRtl() ? 'مستخدم' : 'User');
    const raw = email.split('@')[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  // HR State
  isLoadingHR = signal(false);
  totalEmployees = signal(0);
  totalDepartments = signal(0);
  pendingLeavesCount = signal(0);
  monthlyDisbursed = signal(0);
  pendingLeaves = signal<LeaveRequest[]>([]);

  // Employee State
  isLoadingEmployee = signal(false);
  tardinessSummary = signal<TardinessSummary | null>(null);
  leaveBalances = signal<LeaveBalance[]>([]);
  myRecentLeaves = signal<EmployeeLeaveRequest[]>([]);

  ngOnInit() {
    if (this.isHR()) {
      this.loadHRDashboard();
    } else {
      this.loadEmployeeDashboard();
    }
  }

  loadHRDashboard() {
    this.isLoadingHR.set(true);

    // 1. Employees count
    this.employeeService.getAll(1, 1).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.totalEmployees.set(res.data.totalCount);
        }
      }
    });

    // 2. Departments count
    this.departmentService.getAll(1, 1).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.totalDepartments.set(res.data.totalCount);
        }
      }
    });

    // 3. Pending leave requests
    this.leaveService.getAll('Pending', undefined, 1, 10).subscribe({
      next: res => {
        this.isLoadingHR.set(false);
        if (res.success && res.data) {
          this.pendingLeaves.set(res.data.items);
          this.pendingLeavesCount.set(res.data.totalCount);
        }
      },
      error: () => this.isLoadingHR.set(false)
    });

    // 4. Current month payroll snapshot
    this.payrollService.getByMonth(this.currentMonth, this.currentYear).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.monthlyDisbursed.set(res.data.totalNetPay);
        }
      }
    });
  }

  loadEmployeeDashboard() {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.isLoadingEmployee.set(false);
      this.tardinessSummary.set(null);
      this.leaveBalances.set([]);
      this.myRecentLeaves.set([]);
      return;
    }

    this.isLoadingEmployee.set(true);

    // 1. Tardiness for current month
    this.attendanceService.getTardiness(empId, this.currentYear, this.currentMonth).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.tardinessSummary.set(res.data);
        }
      }
    });

    // 2. Leave balances
    this.leaveService.getBalances(empId, this.currentYear).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.leaveBalances.set(res.data);
        }
      }
    });

    // 3. My recent requests
    this.leaveService.getByEmployee(empId, undefined, this.currentYear, 1, 5).subscribe({
      next: res => {
        this.isLoadingEmployee.set(false);
        if (res.success && res.data) {
          this.myRecentLeaves.set(res.data.items);
        }
      },
      error: () => this.isLoadingEmployee.set(false)
    });
  }

  quickApprove(leaveId: number) {
    this.leaveService.approve(leaveId).subscribe({
      next: res => {
        if (res.success) {
          const msg = this.ts.t().dashboard?.leaveApprovedSuccess || 'Leave request approved successfully!';
          this.toastService.success(msg);
          this.loadHRDashboard();
        } else {
          const msg = res.message || this.ts.t().dashboard?.approvalFailed || 'Approval failed';
          this.toastService.error(msg);
        }
      }
    });
  }

  tardinessPercentage(tData: TardinessSummary): number {
    if (!tData) return 0;
    return Math.min(100, Math.round((tData.totalLateMinutes / 60) * 100));
  }

  tardinessProgressClass(tData: TardinessSummary): string {
    if (tData.totalLateMinutes > 60) return 'bg-danger';
    if (tData.totalLateMinutes > 45) return 'bg-warning';
    return 'bg-success';
  }
}
