import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="dashboard-page" [dir]="ts.isRtl() ? 'rtl' : 'ltr'">
      <!-- Page Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 animate-fade-in-up">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h2 class="fw-bold mb-0 text-navy">
              {{ ts.t().dashboard?.welcomeBack || 'Welcome back' }}, {{ userName() }}
            </h2>
            <span class="badge" [ngClass]="isHR() ? 'bg-primary' : 'bg-success'">
              {{ userRole() }}
            </span>
          </div>
          <p class="text-muted small mb-0">
            <i class="fas fa-calendar-day" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ today | date:'fullDate' }} &middot; {{ ts.t().dashboard?.realTimeTelemetry || 'Real-time workforce telemetry' }}
          </p>
        </div>

        <!-- Quick Actions (HR) -->
        <div *ngIf="isHR()" class="d-flex gap-2">
          <a routerLink="/payroll/run" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 transition hover-elevate">
            <i class="fas fa-play"></i> {{ ts.t().common?.runPayroll || ts.t()?.dashboard?.runPayroll || 'إجراء الرواتب' }}
          </a>
          <a routerLink="/employees" class="btn btn-primary btn-sm d-flex align-items-center gap-2 transition hover-elevate shadow-sm">
            <i class="fas fa-user-plus"></i> {{ ts.t().common?.manageEmployees || ts.t()?.dashboard?.manageEmployees || 'إدارة الموظفين' }}
          </a>
        </div>

        <!-- Quick Actions (Employee) -->
        <div *ngIf="!isHR()" class="d-flex gap-2">
          <a routerLink="/leaves" class="btn btn-primary btn-sm d-flex align-items-center gap-2 transition hover-elevate shadow-sm">
            <i class="fas fa-paper-plane"></i> {{ ts.t().common?.requestLeave || 'Request Leave' }}
          </a>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- HR ADMIN DASHBOARD                                      -->
      <!-- ======================================================== -->
      <ng-container *ngIf="isHR()">
        <!-- KPI Stat Cards Row -->
        <div class="row g-3 mb-4 animate-fade-in-up" style="animation-delay: 0.1s;">
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="stat-card glass-card">
              <div>
                <div class="stat-label">{{ ts.t().dashboard?.totalEmployees || 'Total Employees' }}</div>
                <div class="stat-value counter-animate">{{ totalEmployees() }}</div>
                <div class="small text-success mt-1">
                  <i class="fas fa-check-circle" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t().dashboard?.activeWorkforce || 'Active Workforce' }}
                </div>
              </div>
              <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-users"></i>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="stat-card glass-card">
              <div>
                <div class="stat-label">{{ ts.t().dashboard?.departments || 'Departments' }}</div>
                <div class="stat-value counter-animate">{{ totalDepartments() }}</div>
                <div class="small text-muted mt-1">
                  <i class="fas fa-layer-group" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t().dashboard?.activeUnits || 'Active Units' }}
                </div>
              </div>
              <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                <i class="fas fa-sitemap"></i>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="stat-card glass-card">
              <div>
                <div class="stat-label">{{ ts.t().dashboard?.pendingLeaves || 'Pending Leaves' }}</div>
                <div class="stat-value text-warning counter-animate">{{ pendingLeavesCount() }}</div>
                <div class="small text-muted mt-1">
                  <i class="fas fa-clock" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t()?.dashboard?.awaitingReview || 'بانتظار المراجعة' }}
                </div>
              </div>
              <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning">
                <i class="fas fa-calendar-alt"></i>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="stat-card glass-card">
              <div>
                <div class="stat-label">{{ ts.t().dashboard?.monthlyPayroll || 'Monthly Payroll' }}</div>
                <div class="stat-value text-success fs-3 counter-animate">
                  {{ (monthlyDisbursed() > 0 ? (monthlyDisbursed() | currency:'USD':'symbol':'1.0-0') : (ts.t().dashboard?.ready || 'Ready')) }}
                </div>
                <div class="small text-muted mt-1">
                  <i class="fas fa-wallet" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t().dashboard?.currentPeriod || 'Current Period' }}
                </div>
              </div>
              <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                <i class="fas fa-money-check-dollar"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 animate-fade-in-up" style="animation-delay: 0.2s;">
          <!-- Pending Approvals Queue -->
          <div class="col-12 col-lg-8">
            <div class="card h-100 shadow-sm border-0 glass-card">
              <div class="card-header bg-transparent border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-clipboard-check text-primary"></i>
                  <span class="fw-bold text-dark">{{ ts.t().dashboard?.pendingLeaveApprovals || 'Pending Leave Approvals' }}</span>
                  <span class="badge bg-warning text-dark rounded-pill shadow-sm">{{ pendingLeaves().length }}</span>
                </div>
                <a routerLink="/leaves" class="small text-decoration-none fw-semibold">
                  {{ ts.t().common?.viewAll || ts.t()?.common?.viewAll || 'عرض الكل' }} 
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left me-1' : 'fa-chevron-right ms-1'"></i>
                </a>
              </div>
              <div class="card-body p-0">
                <div *ngIf="isLoadingHR()" class="p-4">
                  <div class="skeleton skeleton-title w-25 mb-3"></div>
                  <div class="skeleton skeleton-text w-75 mb-2"></div>
                  <div class="skeleton skeleton-text w-50"></div>
                </div>

                <div *ngIf="!isLoadingHR() && pendingLeaves().length === 0" class="empty-state py-5 text-center">
                  <i class="fas fa-check-double text-success fs-1 mb-3"></i>
                  <h6 class="fw-bold">{{ ts.t().dashboard?.allCaughtUp || 'All Caught Up!' }}</h6>
                  <p class="small text-muted mb-0">{{ ts.t().dashboard?.noPendingLeaves || 'No pending leave requests requiring HR review right now.' }}</p>
                </div>

                <div *ngIf="!isLoadingHR() && pendingLeaves().length > 0" class="table-responsive">
                  <table class="table table-hover align-middle mb-0 custom-table">
                    <thead class="bg-light">
                      <tr>
                        <th>{{ ts.t().common?.employee || 'Employee' }}</th>
                        <th>{{ ts.t().common?.type || 'Type' }}</th>
                        <th>{{ ts.t().common?.duration || 'Duration' }}</th>
                        <th>{{ ts.t().common?.days || 'Days' }}</th>
                        <th>{{ ts.t().common?.action || 'Action' }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let leave of pendingLeaves().slice(0, 5)" class="transition-row">
                        <td>
                          <div class="fw-bold text-dark">{{ leave.employeeName }}</div>
                          <span class="text-muted small">{{ leave.departmentName }}</span>
                        </td>
                        <td>
                          <span class="badge bg-light text-dark border shadow-sm">{{ leave.leaveType }}</span>
                        </td>
                        <td class="small text-nowrap">
                          {{ leave.startDate | date:'mediumDate' }} 
                          <i class="fas fa-arrow-right mx-1" [ngClass]="ts.isRtl() ? 'fa-flip-horizontal' : ''"></i> 
                          {{ leave.endDate | date:'mediumDate' }}
                        </td>
                        <td>
                          <span class="badge bg-primary-subtle text-primary fw-bold">{{ leave.totalDays }}d</span>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm shadow-sm">
                            <button
                              class="btn btn-success btn-sm transition"
                              [title]="ts.t().common?.approve || 'Approve immediately'"
                              (click)="quickApprove(leave.id)">
                              <i class="fas fa-check"></i>
                            </button>
                            <a routerLink="/leaves" class="btn btn-outline-secondary btn-sm transition" [title]="ts.t().common?.review || 'Review details'">
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
            <div class="card h-100 shadow-sm border-0 glass-card">
              <div class="card-header bg-transparent border-bottom-0 py-3">
                <span class="fw-bold text-dark">
                  <i class="fas fa-bolt text-warning" [ngClass]="ts.isRtl() ? 'ms-2' : 'me-2'"></i>{{ ts.t().dashboard?.hrOpsShortcuts || 'HR Ops Shortcuts' }}
                </span>
              </div>
              <div class="card-body d-flex flex-column gap-3">
                <a routerLink="/payroll/structures" class="text-decoration-none">
                  <div class="p-3 border rounded-4 bg-white shadow-sm hover-elevate transition d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-indigo bg-opacity-10 text-primary flex-shrink-0">
                      <i class="fas fa-sliders"></i>
                    </div>
                    <div class="text-start">
                      <div class="fw-bold text-dark">{{ ts.t().dashboard?.salaryStructureDesigner || 'Salary Structure Designer' }}</div>
                      <div class="text-muted small">{{ ts.t().dashboard?.configureAllowances || 'Configure allowances, overtime & tax rules' }}</div>
                    </div>
                  </div>
                </a>

                <a routerLink="/attendance" class="text-decoration-none">
                  <div class="p-3 border rounded-4 bg-white shadow-sm hover-elevate transition d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning flex-shrink-0">
                      <i class="fas fa-user-clock"></i>
                    </div>
                    <div class="text-start">
                      <div class="fw-bold text-dark">{{ ts.t().dashboard?.departmentAttendance || 'Department Attendance' }}</div>
                      <div class="text-muted small">{{ ts.t().dashboard?.dailyPunches || 'Daily punches & manual time audit' }}</div>
                    </div>
                  </div>
                </a>

                <a routerLink="/attendance/device-logs" class="text-decoration-none">
                  <div class="p-3 border rounded-4 bg-white shadow-sm hover-elevate transition d-flex align-items-center gap-3">
                    <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info flex-shrink-0">
                      <i class="fas fa-fingerprint"></i>
                    </div>
                    <div class="text-start">
                      <div class="fw-bold text-dark">{{ ts.t().dashboard?.biometricLogs || ts.t().dashboard?.biometricHardwareLogs || 'Biometric Hardware Logs' }}</div>
                      <div class="text-muted small">{{ ts.t().dashboard?.inspectZKTeco || 'Inspect ZKTeco raw punch events' }}</div>
                    </div>
                  </div>
                </a>

                <div class="p-3 rounded-4 bg-slate-100 text-muted small mt-auto border glass-card text-start">
                  <i class="fas fa-info-circle text-primary" [ngClass]="ts.isRtl() ? 'ms-2' : 'me-2'"></i>
                  <strong class="text-dark">{{ ts.t().dashboard?.tardinessRuleActive || '60-Min Tardiness Rule Active:' }}</strong>
                  <span class="d-inline-block">{{ ts.t().dashboard?.freeGraceAllowance || 'Free grace allowance resets at the 1st of every month.' }}</span>
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
        <div class="row g-4 mb-4 animate-fade-in-up" style="animation-delay: 0.1s;">
          <!-- Tardiness Gauge Widget -->
          <div class="col-12 col-lg-6">
            <div class="card h-100 border-0 shadow-sm glass-card">
              <div class="card-header bg-transparent border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-stopwatch text-warning"></i>
                  <span class="fw-bold text-dark">{{ ts.t().dashboard?.myMonthlyTardiness || 'My Monthly Tardiness Allowance' }}</span>
                </div>
                <span class="badge bg-light text-dark border shadow-sm">{{ ts.t().common?.month || 'Month' }} {{ currentMonth }}</span>
              </div>
              <div class="card-body d-flex flex-column justify-content-between">
                <div *ngIf="isLoadingEmployee()">
                  <div class="skeleton skeleton-title w-25 mb-3"></div>
                  <div class="skeleton skeleton-text w-100 mb-2"></div>
                </div>

                <div *ngIf="!isLoadingEmployee() && tardinessSummary() as tData">
                  <div class="d-flex justify-content-between align-items-end mb-2">
                    <div>
                      <span class="fs-1 fw-bold counter-animate" [ngClass]="tData.totalLateMinutes > 60 ? 'text-danger' : 'text-success'">
                        {{ tData.totalLateMinutes }}
                      </span>
                      <span class="text-muted fs-6"> / 60 {{ ts.t().dashboard?.minsUsed || 'mins used' }}</span>
                    </div>

                    <span *ngIf="tData.deductibleMinutes > 0" class="badge bg-danger fs-6 py-2 px-3 shadow-sm rounded-pill transition-bounce">
                      <i class="fas fa-triangle-exclamation" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ tData.deductibleMinutes }} {{ ts.t().dashboard?.minDeductible || 'min deductible' }}
                    </span>
                    <span *ngIf="tData.deductibleMinutes === 0" class="badge bg-success-subtle text-success border border-success fs-6 py-2 px-3 shadow-sm rounded-pill transition-bounce">
                      <i class="fas fa-shield-check" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ ts.t().dashboard?.withinFreeAllowance || 'Within Free Allowance' }}
                    </span>
                  </div>

                  <!-- Visual Progress Bar -->
                  <div class="progress mb-3 rounded-pill shadow-sm bg-light" style="height: 12px;">
                    <div
                      class="progress-bar progress-bar-striped progress-bar-animated rounded-pill"
                      [ngClass]="tardinessProgressClass(tData)"
                      role="progressbar"
                      [style.width.%]="tardinessPercentage(tData)"></div>
                  </div>

                  <div class="d-flex justify-content-between text-muted small">
                    <span><i class="fas fa-history" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i> {{ tData.lateOccurrences }} {{ ts.t().dashboard?.tardyInstances || 'tardy instances' }}</span>
                    <span>{{ ts.t().dashboard?.allowanceFree || 'Allowance: 60 mins/month free' }}</span>
                  </div>
                </div>

                <div class="alert alert-light border mt-3 mb-0 small text-muted glass-card">
                  <i class="fas fa-lightbulb text-warning" [ngClass]="ts.isRtl() ? 'ms-1' : 'me-1'"></i>
                  {{ ts.t().dashboard?.tardinessNote || 'Daily official start time is 09:00 AM. Tardiness beyond 60 minutes is deducted proportionally in monthly payroll.' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Balance Overview -->
          <div class="col-12 col-lg-6">
            <div class="card h-100 border-0 shadow-sm glass-card">
              <div class="card-header bg-transparent border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-umbrella-beach text-primary"></i>
                  <span class="fw-bold text-dark">{{ ts.t().dashboard?.myLeaveBalances || 'My Leave Balances' }}</span>
                </div>
                <a routerLink="/leaves/balances" class="small text-decoration-none fw-semibold">
                  {{ ts.t().dashboard?.allBalances || 'All Balances' }} 
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-arrow-left ms-1' : 'fa-arrow-right ms-1'"></i>
                </a>
              </div>
              <div class="card-body">
                <div *ngIf="isLoadingEmployee()">
                  <div class="skeleton skeleton-title w-50 mb-3"></div>
                  <div class="skeleton skeleton-text w-75 mb-2"></div>
                </div>

                <div *ngIf="!isLoadingEmployee() && leaveBalances().length === 0" class="empty-state py-3 text-center">
                  <p class="small text-muted mb-0">{{ ts.t().dashboard?.noActiveLeaveQuota || 'No active leave quota configured for this year.' }}</p>
                </div>

                <div *ngIf="!isLoadingEmployee() && leaveBalances().length > 0" class="d-flex flex-column gap-3">
                  <div *ngFor="let b of leaveBalances()" class="p-3 border rounded-4 bg-white shadow-sm hover-elevate transition">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="fw-bold text-dark small">{{ b.leaveType }} {{ ts.t().common?.leave || 'Leave' }}</span>
                      <span class="small font-monospace bg-light px-2 py-1 rounded">
                        <strong class="text-primary">{{ b.remainingDays }}</strong> / {{ b.totalDays }} {{ ts.t().dashboard?.daysLeft || 'days left' }}
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
        <div class="card border-0 shadow-sm mb-4 glass-card animate-fade-in-up" style="animation-delay: 0.2s;">
          <div class="card-header bg-transparent border-bottom-0 py-3 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i class="fas fa-list-check text-primary"></i>
              <span class="fw-bold text-dark">{{ ts.t().dashboard?.myRecentLeaves || 'My Recent Leave Requests' }}</span>
            </div>
            <a routerLink="/leaves" class="btn btn-sm btn-outline-primary transition hover-elevate shadow-sm">
              {{ ts.t().dashboard?.submitNewRequest || 'Submit New Request' }}
            </a>
          </div>
          <div class="card-body p-0">
            <div *ngIf="myRecentLeaves().length === 0" class="empty-state py-5 text-center">
              <i class="fas fa-folder-open text-muted fs-1 mb-3"></i>
              <p class="small text-muted mb-0">{{ ts.t().dashboard?.noLeaveRequestsYet || 'You have not submitted any leave requests yet.' }}</p>
            </div>

            <div *ngIf="myRecentLeaves().length > 0" class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead class="bg-light">
                  <tr>
                    <th>{{ ts.t().common?.type || 'Type' }}</th>
                    <th>{{ ts.t().common?.startDate || 'Start Date' }}</th>
                    <th>{{ ts.t().common?.endDate || 'End Date' }}</th>
                    <th>{{ ts.t().common?.days || 'Days' }}</th>
                    <th>{{ ts.t().common?.status || 'Status' }}</th>
                    <th>{{ ts.t().common?.rejectionReason || 'Rejection Reason' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of myRecentLeaves()" class="transition-row">
                    <td><span class="badge bg-white text-dark border shadow-sm">{{ req.leaveType }}</span></td>
                    <td class="small">{{ req.startDate | date:'mediumDate' }}</td>
                    <td class="small">{{ req.endDate | date:'mediumDate' }}</td>
                    <td><strong class="text-primary">{{ req.totalDays }}</strong></td>
                    <td>
                      <span
                        class="badge rounded-pill shadow-sm border py-1 px-2"
                        [ngClass]="{
                          'bg-warning-subtle text-warning border-warning': req.status === 'Pending',
                          'bg-success-subtle text-success border-success': req.status === 'Approved',
                          'bg-danger-subtle text-danger border-danger': req.status === 'Rejected'
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
      font-family: var(--font-family, 'Inter', 'Cairo', sans-serif);
    }
    
    .glass-card {
      background: var(--bg-surface-solid, #ffffff);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-radius: 1rem;
      background: var(--bg-surface-solid, #ffffff);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      transition: all 0.3s ease;
      height: 100%;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

    .stat-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .hover-elevate {
      transition: all 0.2s ease-in-out;
    }
    .hover-elevate:hover {
      background-color: #ffffff !important;
      box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1) !important;
      transform: translateY(-2px);
    }

    .transition {
      transition: all 0.3s ease;
    }

    .transition-row {
      transition: background-color 0.2s ease;
    }
    .transition-row:hover {
      background-color: rgba(248, 250, 252, 0.8) !important;
    }

    .transition-bounce {
      animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .custom-table th {
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 1rem;
      border-bottom-width: 2px;
    }
    
    .custom-table td {
      padding: 1rem;
      vertical-align: middle;
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .counter-animate {
      animation: countUp 1s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); opacity: 1; }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }

    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  ts = inject(TranslationService);
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

  isHR = this.authService.isHR;
  userRole = computed(() => {
    const role = this.authService.currentUser()?.role || 'Employee';
    // attempt translation if structured roles exist, fallback to original
    return this.ts.t().dashboard?.roles?.[role] || role;
  });
  userName = computed(() => {
    const email = this.authService.currentUser()?.email;
    return email ? email.split('@')[0] : 'User';
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
    const empId = this.authService.getEmployeeId() || 1;
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
