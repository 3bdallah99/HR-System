import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  UploadAttendanceSheetResult,
  AttendanceSummary,
  MonthlyAttendanceMatrix,
  TardinessSummary,
  Department
} from '../../core/util/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="attendance-page" [dir]="ts.isRtl() ? 'rtl' : 'ltr'">
      <!-- Standard Page Header -->
      <div class="hr-page-header">
        <div class="header-content">
          <h2 class="header-title">
            <i class="fas fa-calendar-check"></i>
            <span>{{ ts.isRtl() ? 'سجلات الحضور والانصراف' : 'Attendance & Timesheets' }}</span>
          </h2>
          <p class="header-subtitle">
            {{ ts.isRtl() ? 'إدارة الموقف اليومي المباشر والشيت الشهري الشامل لكافة الموظفين' : 'Manage live daily attendance and comprehensive monthly timesheets' }}
          </p>
        </div>
        @if (authService.isHR()) {
          <div class="header-actions">
            <!-- Download Template Dropdown -->
            <div class="btn-group position-relative">
              <button class="btn btn-outline-secondary" type="button" (click)="toggleTemplateMenu()">
                <i class="fas fa-file-download me-1"></i>
                <span>{{ ts.isRtl() ? 'تنزيل النموذج' : 'Download Template' }}</span>
              </button>
              @if (showTemplateMenu()) {
                <div class="dropdown-menu show shadow-sm" [class.dropdown-menu-end]="!ts.isRtl()">
                  <button class="dropdown-item d-flex align-items-center gap-2" (click)="downloadTemplate('excel')">
                    <i class="fas fa-file-excel text-success"></i>
                    <span>{{ ts.isRtl() ? 'نموذج إكسل (.xlsx)' : 'Excel Template (.xlsx)' }}</span>
                  </button>
                  <button class="dropdown-item d-flex align-items-center gap-2" (click)="downloadTemplate('csv')">
                    <i class="fas fa-file-csv text-primary"></i>
                    <span>{{ ts.isRtl() ? 'نموذج CSV (.csv)' : 'CSV Template (.csv)' }}</span>
                  </button>
                </div>
              }
            </div>

            <!-- Upload Sheet Button -->
            <button class="btn btn-primary" (click)="openUploadModal()">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>{{ ts.isRtl() ? 'رفع كشف الحضور' : 'Upload Sheet' }}</span>
            </button>
          </div>
        }
      </div>

      <!-- Segmented View Tabs -->
      <div class="view-tabs-bar mb-4">
        <div class="nav nav-pills d-inline-flex p-1 bg-light rounded-pill border shadow-sm">
          <button class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                  [class.active]="activeTab() === 'daily'"
                  (click)="switchTab('daily')">
            <i class="fas fa-calendar-day"></i>
            <span>{{ ts.isRtl() ? 'الموقف اليومي المباشر' : 'Daily Snapshot' }}</span>
          </button>
          <button class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                  [class.active]="activeTab() === 'monthly'"
                  (click)="switchTab('monthly')">
            <i class="fas fa-th"></i>
            <span>{{ ts.isRtl() ? 'الشيت الشبكي الشهري' : 'Monthly Matrix' }}</span>
          </button>
          <button class="nav-link rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                  [class.active]="activeTab() === 'employee'"
                  (click)="switchTab('employee')">
            <i class="fas fa-user-clock"></i>
            <span>{{ ts.isRtl() ? 'كشف حساب موظف' : 'Employee Timesheet' }}</span>
          </button>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- TAB 1: DAILY SNAPSHOT VIEW                                          -->
      <!-- =================================================================== -->
      @if (activeTab() === 'daily') {
        <!-- Date Navigator Bar -->
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 bg-white rounded-3 mb-4 border shadow-sm">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-secondary px-3" (click)="navigateDay(-1)" [title]="ts.isRtl() ? 'اليوم السابق' : 'Previous Day'">
              <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
              <span class="ms-1 d-none d-sm-inline">{{ ts.isRtl() ? 'السابق' : 'Prev' }}</span>
            </button>

            <div class="input-group input-group-sm" style="width: auto;">
              <span class="input-group-text bg-light border-end-0">
                <i class="fas fa-calendar-alt text-primary"></i>
              </span>
              <input type="date" class="form-control border-start-0 ps-2"
                     [ngModel]="selectedDate()"
                     (ngModelChange)="onDateChange($event)"
                     style="font-weight: 600; min-width: 140px;">
            </div>

            <button class="btn btn-sm btn-outline-secondary px-3" (click)="navigateDay(1)" [title]="ts.isRtl() ? 'اليوم التالي' : 'Next Day'">
              <span class="me-1 d-none d-sm-inline">{{ ts.isRtl() ? 'التالي' : 'Next' }}</span>
              <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
            </button>

            <button class="btn btn-sm btn-primary-subtle text-primary border px-3" (click)="goToToday()">
              <i class="fas fa-crosshairs me-1"></i>
              {{ ts.isRtl() ? 'اليوم الحالي' : 'Today' }}
            </button>
          </div>

          <div class="d-flex align-items-center gap-3">
            <span class="badge bg-light text-dark border p-2 font-monospace">
              <i class="fas fa-clock text-secondary me-1"></i>
              {{ selectedDate() | date:'fullDate' }}
            </span>
          </div>
        </div>

        <!-- KPI Statistics Cards (Reflecting selected day) -->
        <div class="hr-stats-grid mb-4">
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.isRtl() ? 'حاضر في الموعد' : 'Present' }}</span>
              <span class="stat-value text-success">{{ stats().present }}</span>
            </div>
            <div class="stat-icon icon-success">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.isRtl() ? 'متأخر' : 'Late' }}</span>
              <span class="stat-value text-warning">{{ stats().late }}</span>
            </div>
            <div class="stat-icon icon-warning">
              <i class="fas fa-clock"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.isRtl() ? 'غائب' : 'Absent' }}</span>
              <span class="stat-value text-danger">{{ stats().absent }}</span>
            </div>
            <div class="stat-icon icon-danger">
              <i class="fas fa-times-circle"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ ts.isRtl() ? 'في إجازة' : 'On Leave' }}</span>
              <span class="stat-value text-info">{{ stats().onLeave }}</span>
            </div>
            <div class="stat-icon icon-info">
              <i class="fas fa-plane-departure"></i>
            </div>
          </div>
        </div>

        <!-- Daily Filter Bar (Search by Employee / Status) -->
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'بحث عن موظف' : 'Search Employee' }}</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
                <input type="text" class="form-control border-start-0"
                       [(ngModel)]="dailySearchTerm"
                       [placeholder]="ts.isRtl() ? 'اكتب اسم الموظف أو رقم البصمة...' : 'Type employee name or badge...'">
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'تصفية حسب الحالة' : 'Filter by Status' }}</label>
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadData(1)">
                <option value="">{{ ts.isRtl() ? 'جميع الحالات' : 'All Statuses' }}</option>
                <option value="Present">{{ ts.isRtl() ? 'حاضر' : 'Present' }}</option>
                <option value="Late">{{ ts.isRtl() ? 'متأخر' : 'Late' }}</option>
                <option value="Absent">{{ ts.isRtl() ? 'غائب' : 'Absent' }}</option>
                <option value="OnLeave">{{ ts.isRtl() ? 'في إجازة' : 'On Leave' }}</option>
              </select>
            </div>

            <div class="col-md-3 d-flex gap-2">
              <button class="btn btn-outline-secondary w-100" (click)="resetFilters()">
                <i class="fas fa-undo me-1"></i>
                {{ ts.isRtl() ? 'إعادة ضبط' : 'Reset' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Daily Records Table -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div class="table-responsive">
            <table class="table hr-table align-middle mb-0">
              <thead>
                <tr>
                  <th>{{ ts.isRtl() ? 'الموظف' : 'Employee' }}</th>
                  <th>{{ ts.isRtl() ? 'التاريخ' : 'Date' }}</th>
                  <th>{{ ts.isRtl() ? 'وقت الدخول' : 'Clock In' }}</th>
                  <th>{{ ts.isRtl() ? 'وقت الخروج' : 'Clock Out' }}</th>
                  <th>{{ ts.isRtl() ? 'دقائق التأخير' : 'Late' }}</th>
                  <th>{{ ts.isRtl() ? 'الحالة' : 'Status' }}</th>
                  <th>{{ ts.isRtl() ? 'ملاحظات' : 'Note' }}</th>
                  <th class="text-end">{{ ts.isRtl() ? 'إجراء' : 'Action' }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr>
                    <td colspan="8" class="text-center py-5">
                      <div class="spinner-border text-primary" role="status"></div>
                      <div class="text-muted mt-2">{{ ts.isRtl() ? 'جاري تحميل الحضور...' : 'Loading attendance...' }}</div>
                    </td>
                  </tr>
                } @else if (filteredDailyItems().length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                      <i class="fas fa-calendar-times fs-1 text-secondary opacity-50 mb-3 d-block"></i>
                      <div class="fw-bold">{{ ts.isRtl() ? 'لا توجد سجلات حضور مسجلة لهذا اليوم' : 'No attendance records found for this date' }}</div>
                      <div class="small mt-1">{{ ts.isRtl() ? 'يمكنك رفع كشف البصمة أو تسجيل الحضور يدوياً' : 'You can upload biometric sheet or create manual records' }}</div>
                    </td>
                  </tr>
                } @else {
                  @for (item of filteredDailyItems(); track item.id) {
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">
                          {{ item.employeeName || (ts.isRtl() ? 'موظف #' + item.employeeId : 'Employee #' + item.employeeId) }}
                        </div>
                        @if (item.badgeNumber) {
                          <div class="small text-muted font-monospace d-inline-flex align-items-center gap-1">
                            <i class="fas fa-id-badge text-secondary"></i>
                            <span>{{ item.badgeNumber }}</span>
                          </div>
                        }
                      </td>
                      <td class="text-nowrap font-monospace">{{ item.date | date:'yyyy-MM-dd' }}</td>
                      <td>
                        @if (item.clockIn) {
                          <span class="text-success text-nowrap font-monospace fw-semibold">
                            <i class="fas fa-arrow-down me-1"></i>{{ item.clockIn | date:'shortTime' }}
                          </span>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      </td>
                      <td>
                        @if (item.clockOut) {
                          <span class="text-danger text-nowrap font-monospace fw-semibold">
                            <i class="fas fa-arrow-up me-1"></i>{{ item.clockOut | date:'shortTime' }}
                          </span>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      </td>
                      <td>
                        @if (item.lateMinutes && item.lateMinutes > 0) {
                          <span class="badge bg-warning-subtle text-warning fw-semibold font-monospace">
                            <i class="fas fa-clock me-1"></i>{{ item.lateMinutes }} {{ ts.isRtl() ? 'دقيقة' : 'min' }}
                          </span>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      </td>
                      <td>
                        @switch (resolveItemStatus(item)) {
                          @case ('onLeave') {
                            <span class="hr-badge badge-info"><i class="fas fa-plane-departure"></i> {{ ts.isRtl() ? 'في إجازة' : 'On Leave' }}</span>
                          }
                          @case ('weekend') {
                            <span class="hr-badge badge-neutral"><i class="fas fa-couch"></i> {{ ts.isRtl() ? 'عطلة أسبوعية' : 'Weekend' }}</span>
                          }
                          @case ('present') {
                            <span class="hr-badge badge-success"><i class="fas fa-check-circle"></i> {{ ts.isRtl() ? 'حاضر' : 'Present' }}</span>
                          }
                          @case ('late') {
                            <span class="hr-badge badge-warning"><i class="fas fa-clock"></i> {{ ts.isRtl() ? 'متأخر' : 'Late' }}</span>
                          }
                          @default {
                            <span class="hr-badge badge-danger"><i class="fas fa-times-circle"></i> {{ ts.isRtl() ? 'غائب' : 'Absent' }}</span>
                          }
                        }
                      </td>
                      <td>
                        @if (item.note) {
                          <span class="text-secondary small">{{ item.note }}</span>
                        } @else {
                          <span class="text-muted small">-</span>
                        }
                      </td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary"
                                (click)="drillDownEmployee(item.employeeId)"
                                [title]="ts.isRtl() ? 'عرض كشف حساب الموظف' : 'View Employee Timesheet'">
                          <i class="fas fa-user-clock"></i>
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="card-footer bg-white border-top py-3 px-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span class="text-muted small">
                {{ ts.isRtl() ? 'عدد السجلات المعروضة لهذا اليوم:' : 'Showing records for today:' }}
                <strong>{{ filteredDailyItems().length }}</strong>
              </span>
              <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">{{ ts.isRtl() ? 'صفحة' : 'Page' }} {{ page() }}</span>
                <button class="btn btn-sm btn-outline-secondary" [disabled]="page() === 1" (click)="loadData(page() - 1)">
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" [disabled]="page() * pageSize >= totalCount()" (click)="loadData(page() + 1)">
                  <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- =================================================================== -->
      <!-- TAB 2: MONTHLY TIMESHEET MATRIX GRID VIEW                           -->
      <!-- =================================================================== -->
      @if (activeTab() === 'monthly') {
        <!-- Monthly Controls Filter Bar -->
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div class="row g-3 align-items-end">
            <!-- Year Selector -->
            <div class="col-md-2 col-6">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'السنة' : 'Year' }}</label>
              <select class="form-select" [(ngModel)]="matrixYear">
                <option [value]="2025">2025</option>
                <option [value]="2026">2026</option>
                <option [value]="2027">2027</option>
              </select>
            </div>

            <!-- Month Selector -->
            <div class="col-md-3 col-6">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'الشهر' : 'Month' }}</label>
              <select class="form-select" [(ngModel)]="matrixMonth">
                @for (m of monthsList; track m.value) {
                  <option [value]="m.value">{{ ts.isRtl() ? m.nameAr : m.nameEn }}</option>
                }
              </select>
            </div>

            <!-- Department Selector -->
            <div class="col-md-3 col-12">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'القسم' : 'Department' }}</label>
              <select class="form-select" [(ngModel)]="matrixDeptId">
                <option [ngValue]="undefined">{{ ts.isRtl() ? 'كافة الأقسام' : 'All Departments' }}</option>
                @for (dept of departments(); track dept.id) {
                  <option [ngValue]="dept.id">{{ dept.name }}</option>
                }
              </select>
            </div>

            <!-- Cycle Toggle -->
            <div class="col-md-2 col-6">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'نطاق الدورة' : 'Cycle Range' }}</label>
              <button class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1"
                      [class.btn-primary]="isPayrollCycle()"
                      [class.text-white]="isPayrollCycle()"
                      (click)="togglePayrollCycle()">
                <i class="fas fa-sync-alt"></i>
                <span class="small">{{ isPayrollCycle() ? (ts.isRtl() ? 'دورة رواتب (26-25)' : 'Payroll Cycle (26-25)') : (ts.isRtl() ? 'شهر تقويمي (1-31)' : 'Calendar Month') }}</span>
              </button>
            </div>

            <!-- Action Button -->
            <div class="col-md-2 col-6">
              <button class="btn btn-primary w-100" (click)="loadMonthlyMatrix()" [disabled]="matrixLoading()">
                @if (matrixLoading()) {
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                } @else {
                  <i class="fas fa-search me-1"></i>
                }
                {{ ts.isRtl() ? 'عرض الشيت' : 'Load Matrix' }}
              </button>
            </div>
          </div>
        </div>

        @if (matrixLoading()) {
          <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white mb-4">
            <div class="spinner-border text-primary mx-auto mb-3" role="status"></div>
            <h6 class="fw-bold">{{ ts.isRtl() ? 'جاري بناء مصفوفة دوام الموظفين...' : 'Generating monthly attendance matrix...' }}</h6>
            <p class="text-muted small mb-0">{{ ts.isRtl() ? 'يتم تجميع كافة السجلات والإجازات وعطلات نهاية الأسبوع' : 'Aggregating records, leaves, and weekends for all active employees' }}</p>
          </div>
        } @else {
          @if (matrixData(); as matrix) {
          <!-- Matrix Summary Metrics -->
          <div class="row g-3 mb-4">
            <div class="col-md-3 col-6">
              <div class="p-3 bg-white rounded-4 border shadow-sm d-flex align-items-center gap-3">
                <div class="rounded-circle p-3 bg-primary-subtle text-primary fs-4"><i class="fas fa-users"></i></div>
                <div>
                  <div class="small text-muted">{{ ts.isRtl() ? 'إجمالي الموظفين' : 'Total Employees' }}</div>
                  <div class="fs-4 fw-bold text-dark">{{ matrix.summary.totalEmployees }}</div>
                </div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-3 bg-white rounded-4 border shadow-sm d-flex align-items-center gap-3">
                <div class="rounded-circle p-3 bg-success-subtle text-success fs-4"><i class="fas fa-user-check"></i></div>
                <div>
                  <div class="small text-muted">{{ ts.isRtl() ? 'أيام الحضور' : 'Present Days' }}</div>
                  <div class="fs-4 fw-bold text-success">{{ matrix.summary.totalPresentDays }}</div>
                </div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-3 bg-white rounded-4 border shadow-sm d-flex align-items-center gap-3">
                <div class="rounded-circle p-3 bg-warning-subtle text-warning fs-4"><i class="fas fa-user-clock"></i></div>
                <div>
                  <div class="small text-muted">{{ ts.isRtl() ? 'دقائق التأخير' : 'Late Minutes' }}</div>
                  <div class="fs-4 fw-bold text-warning">{{ matrix.summary.totalLateMinutes }} <span class="small font-monospace">{{ ts.isRtl() ? 'د' : 'm' }}</span></div>
                </div>
              </div>
            </div>

            <div class="col-md-3 col-6">
              <div class="p-3 bg-white rounded-4 border shadow-sm d-flex align-items-center gap-3">
                <div class="rounded-circle p-3 bg-danger-subtle text-danger fs-4"><i class="fas fa-user-times"></i></div>
                <div>
                  <div class="small text-muted">{{ ts.isRtl() ? 'أيام الغياب' : 'Absent Days' }}</div>
                  <div class="fs-4 fw-bold text-danger">{{ matrix.summary.totalAbsentDays }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- The Matrix Table with Sticky Column -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
            <div class="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-bold mb-0 text-dark">
                  <i class="fas fa-table text-primary me-1"></i>
                  <span>{{ ts.isRtl() ? 'مصفوفة دوام الموظفين للشهر' : 'Monthly Timesheet Grid' }}</span>
                </h6>
                <span class="badge bg-light text-muted border font-monospace">
                  {{ matrix.startDate }} &rarr; {{ matrix.endDate }}
                </span>
              </div>

              <!-- Legend -->
              <div class="d-flex align-items-center gap-3 flex-wrap small text-muted">
                <span class="d-inline-flex align-items-center gap-1"><span class="badge-mini bg-success text-white">P</span> {{ ts.isRtl() ? 'حاضر' : 'Present' }}</span>
                <span class="d-inline-flex align-items-center gap-1"><span class="badge-mini bg-warning text-dark">L</span> {{ ts.isRtl() ? 'متأخر' : 'Late' }}</span>
                <span class="d-inline-flex align-items-center gap-1"><span class="badge-mini bg-danger text-white">A</span> {{ ts.isRtl() ? 'غياب' : 'Absent' }}</span>
                <span class="d-inline-flex align-items-center gap-1"><span class="badge-mini bg-info text-white">OL</span> {{ ts.isRtl() ? 'إجازة' : 'Leave' }}</span>
                <span class="d-inline-flex align-items-center gap-1"><span class="badge-mini bg-secondary-subtle text-secondary">W</span> {{ ts.isRtl() ? 'عطلة' : 'Weekend' }}</span>
              </div>
            </div>

            <div class="matrix-table-container">
              <table class="table matrix-table table-bordered mb-0">
                <thead>
                  <tr>
                    <th class="sticky-col-header employee-col bg-light">
                      {{ ts.isRtl() ? 'الموظف' : 'Employee' }}
                    </th>
                    @for (day of matrix.days; track day.dateString) {
                      <th class="text-center day-col" [class.weekend-col]="day.isWeekend">
                        <div class="small text-muted font-monospace">{{ day.dayName }}</div>
                        <div class="fw-bold">{{ day.dayNumber }}</div>
                      </th>
                    }
                    <th class="summary-col bg-light text-center">{{ ts.isRtl() ? 'حضور' : 'Present' }}</th>
                    <th class="summary-col bg-light text-center">{{ ts.isRtl() ? 'تأخير' : 'Late (m)' }}</th>
                    <th class="summary-col bg-light text-center">{{ ts.isRtl() ? 'غياب' : 'Absent' }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (emp of matrix.employees; track emp.employeeId) {
                    <tr>
                      <td class="sticky-col employee-cell bg-white">
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="text-truncate cursor-pointer" (click)="drillDownEmployee(emp.employeeId)">
                            <div class="fw-bold text-primary hover-underline text-truncate">{{ emp.employeeName }}</div>
                            <div class="small text-muted font-monospace d-flex align-items-center gap-1">
                              <span>{{ emp.departmentName }}</span>
                              @if (emp.badgeNumber) {
                                <span>&bull; {{ emp.badgeNumber }}</span>
                              }
                            </div>
                          </div>
                        </div>
                      </td>

                      @for (day of matrix.days; track day.dateString) {
                        @let statusObj = emp.days[day.dateString];
                        <td class="text-center cell-status p-1" [class.weekend-cell]="day.isWeekend">
                          @if (statusObj) {
                            @switch (statusObj.status) {
                              @case ('Present') {
                                <span class="badge-mini bg-success text-white" [title]="'حاضر: ' + (statusObj.clockIn ? (statusObj.clockIn | date:'shortTime') : '')">P</span>
                              }
                              @case ('Late') {
                                <span class="badge-mini bg-warning text-dark font-monospace" [title]="'تأخير ' + statusObj.lateMinutes + ' دقيقة'">L</span>
                              }
                              @case ('Absent') {
                                <span class="badge-mini bg-danger text-white" title="غياب">A</span>
                              }
                              @case ('OnLeave') {
                                <span class="badge-mini bg-info text-white" title="إجازة معتمدة">OL</span>
                              }
                              @case ('Weekend') {
                                <span class="badge-mini text-muted opacity-50">W</span>
                              }
                              @case ('Future') {
                                <span class="text-muted small">&middot;</span>
                              }
                              @default {
                                <span class="text-muted small">&middot;</span>
                              }
                            }
                          } @else {
                            <span class="text-muted small">&middot;</span>
                          }
                        </td>
                      }

                      <!-- Total Counters -->
                      <td class="summary-cell text-center font-monospace fw-bold text-success">
                        {{ emp.totalPresent }}
                      </td>
                      <td class="summary-cell text-center font-monospace fw-bold text-warning">
                        {{ emp.totalLateMinutes }}
                      </td>
                      <td class="summary-cell text-center font-monospace fw-bold text-danger">
                        {{ emp.totalAbsent }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          }
        }
      }

      <!-- =================================================================== -->
      <!-- TAB 3: EMPLOYEE TIMESHEET DRILL-DOWN                                -->
      <!-- =================================================================== -->
      @if (activeTab() === 'employee') {
        <!-- Employee Select & Month Filter Bar -->
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'اختر الموظف' : 'Select Employee' }}</label>
              <select class="form-select" [(ngModel)]="drillEmployeeId" (change)="loadEmployeeTimesheet()">
                <option [ngValue]="undefined">{{ ts.isRtl() ? 'اختر موظفاً...' : 'Select employee...' }}</option>
                @for (emp of employees(); track emp.id) {
                  <option [ngValue]="emp.id">
                    {{ emp.firstName }} {{ emp.lastName }} {{ emp.badgeNumber ? '(' + emp.badgeNumber + ')' : '(#' + emp.id + ')' }}
                  </option>
                }
              </select>
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'الشهر' : 'Month' }}</label>
              <select class="form-select" [(ngModel)]="drillMonth" (change)="loadEmployeeTimesheet()">
                @for (m of monthsList; track m.value) {
                  <option [value]="m.value">{{ ts.isRtl() ? m.nameAr : m.nameEn }}</option>
                }
              </select>
            </div>

            <div class="col-md-2">
              <label class="form-label small fw-semibold text-muted">{{ ts.isRtl() ? 'السنة' : 'Year' }}</label>
              <select class="form-select" [(ngModel)]="drillYear" (change)="loadEmployeeTimesheet()">
                <option [value]="2025">2025</option>
                <option [value]="2026">2026</option>
                <option [value]="2027">2027</option>
              </select>
            </div>

            <div class="col-md-2">
              <button class="btn btn-primary w-100" (click)="loadEmployeeTimesheet()" [disabled]="!drillEmployeeId">
                <i class="fas fa-sync-alt me-1"></i>
                {{ ts.isRtl() ? 'تحديث' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>

        @if (!drillEmployeeId) {
          <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white mb-4">
            <i class="fas fa-user-clock fs-1 text-primary opacity-50 mb-3 d-block"></i>
            <h5 class="fw-bold">{{ ts.isRtl() ? 'الرجاء اختيار موظف لعرض كشف الحضور الخاص به' : 'Please select an employee to view their detailed timesheet' }}</h5>
            <p class="text-muted small mb-0">{{ ts.isRtl() ? 'يمكنك الاختيار من القائمة أعلاه أو النقر على اسم أي موظف في الشيت الشبكي' : 'Select from dropdown above or click employee name in the matrix' }}</p>
          </div>
        } @else {
          <!-- Tardiness Summary Card -->
          @if (tardinessSummary(); as tardiness) {
            <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-4 border-warning">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h5 class="fw-bold mb-1 text-dark">
                    <i class="fas fa-clock text-warning me-2"></i>
                    <span>{{ ts.isRtl() ? 'موقف التأخير الشهري للموظف:' : 'Monthly Tardiness Breakdown:' }} {{ tardiness.employeeName }}</span>
                  </h5>
                  <p class="text-muted small mb-0 font-monospace">
                    {{ ts.isRtl() ? 'دورة الرواتب لشهر' : 'Payroll cycle for' }} {{ tardiness.month }} / {{ tardiness.year }}
                  </p>
                </div>

                <div class="d-flex align-items-center gap-4 flex-wrap">
                  <div class="text-center">
                    <div class="small text-muted">{{ ts.isRtl() ? 'الحد المسموح مجاناً' : 'Monthly Allowance' }}</div>
                    <div class="fs-5 fw-bold text-success">{{ tardiness.allowedMinutes }} <span class="small font-monospace">{{ ts.isRtl() ? 'دقيقة' : 'min' }}</span></div>
                  </div>

                  <div class="text-center">
                    <div class="small text-muted">{{ ts.isRtl() ? 'إجمالي التأخير الفعلي' : 'Total Late' }}</div>
                    <div class="fs-5 fw-bold text-warning">{{ tardiness.totalLateMinutes }} <span class="small font-monospace">{{ ts.isRtl() ? 'دقيقة' : 'min' }}</span></div>
                  </div>

                  <div class="text-center">
                    <div class="small text-muted">{{ ts.isRtl() ? 'خاضع للخصم المالي' : 'Deductible Late' }}</div>
                    <div class="fs-5 fw-bold text-danger">{{ tardiness.deductibleMinutes }} <span class="small font-monospace">{{ ts.isRtl() ? 'دقيقة' : 'min' }}</span></div>
                  </div>

                  <div class="text-center">
                    <div class="small text-muted">{{ ts.isRtl() ? 'مرات التأخير' : 'Occurrences' }}</div>
                    <div class="fs-5 fw-bold text-dark">{{ tardiness.lateOccurrences }}</div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Employee Individual Daily Timeline Table -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
            <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 class="fw-bold mb-0 text-dark">
                <i class="fas fa-list text-primary me-2"></i>
                <span>{{ ts.isRtl() ? 'حركات الحضور والانصراف للموظف' : 'Employee Daily Attendance Records' }}</span>
              </h6>
              <span class="badge bg-light text-muted border font-monospace">
                {{ employeeRecords().length }} {{ ts.isRtl() ? 'سجل' : 'records' }}
              </span>
            </div>

            <div class="table-responsive">
              <table class="table hr-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{{ ts.isRtl() ? 'اليوم والتاريخ' : 'Date' }}</th>
                    <th>{{ ts.isRtl() ? 'وقت الدخول' : 'Clock In' }}</th>
                    <th>{{ ts.isRtl() ? 'وقت الخروج' : 'Clock Out' }}</th>
                    <th>{{ ts.isRtl() ? 'دقائق التأخير' : 'Late Minutes' }}</th>
                    <th>{{ ts.isRtl() ? 'الحالة' : 'Status' }}</th>
                    <th>{{ ts.isRtl() ? 'الملاحظات' : 'Note' }}</th>
                  </tr>
                </thead>
                <tbody>
                  @if (employeeRecords().length === 0) {
                    <tr>
                      <td colspan="6" class="text-center py-5 text-muted">
                        <i class="fas fa-inbox fs-2 text-secondary opacity-50 mb-2 d-block"></i>
                        {{ ts.isRtl() ? 'لا توجد سجلات مسجلة لهذا الموظف في هذا الشهر' : 'No attendance logs for this employee in this month' }}
                      </td>
                    </tr>
                  } @else {
                    @for (rec of employeeRecords(); track rec.id) {
                      <tr>
                        <td class="fw-bold font-monospace text-dark">{{ rec.date | date:'yyyy-MM-dd' }}</td>
                        <td>
                          @if (rec.clockIn) {
                            <span class="text-success font-monospace fw-semibold">
                              <i class="fas fa-arrow-down me-1"></i>{{ rec.clockIn | date:'shortTime' }}
                            </span>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>
                          @if (rec.clockOut) {
                            <span class="text-danger font-monospace fw-semibold">
                              <i class="fas fa-arrow-up me-1"></i>{{ rec.clockOut | date:'shortTime' }}
                            </span>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>
                          @if (rec.lateMinutes && rec.lateMinutes > 0) {
                            <span class="badge bg-warning-subtle text-warning fw-semibold font-monospace">
                              {{ rec.lateMinutes }} {{ ts.isRtl() ? 'دقيقة' : 'min' }}
                            </span>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </td>
                        <td>
                          @switch (resolveItemStatus(rec)) {
                            @case ('present') {
                              <span class="hr-badge badge-success"><i class="fas fa-check-circle"></i> {{ ts.isRtl() ? 'حاضر' : 'Present' }}</span>
                            }
                            @case ('late') {
                              <span class="hr-badge badge-warning"><i class="fas fa-clock"></i> {{ ts.isRtl() ? 'متأخر' : 'Late' }}</span>
                            }
                            @case ('onLeave') {
                              <span class="hr-badge badge-info"><i class="fas fa-plane-departure"></i> {{ ts.isRtl() ? 'في إجازة' : 'On Leave' }}</span>
                            }
                            @default {
                              <span class="hr-badge badge-danger"><i class="fas fa-times-circle"></i> {{ ts.isRtl() ? 'غائب' : 'Absent' }}</span>
                            }
                          }
                        </td>
                        <td class="small text-muted">{{ rec.note || '-' }}</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- =================================================================== -->
      <!-- UPLOAD SHEET MODAL                                                  -->
      <!-- =================================================================== -->
      @if (showUploadModal()) {
        <div class="modal-backdrop fade show"></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="onBackdropClick($event)">
          <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header bg-light border-0 py-3 px-4">
                <h5 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                  <i class="fas fa-file-excel text-success fs-4"></i>
                  {{ ts.isRtl() ? 'رفع ومعالجة كشف الحضور' : 'Upload & Process Attendance Sheet' }}
                </h5>
                <button type="button" class="btn-close" (click)="closeUploadModal()" aria-label="Close"></button>
              </div>

              <div class="modal-body p-4">
                <!-- Dropzone -->
                <div class="upload-dropzone p-4 text-center rounded-3 border-2 border-dashed mb-3"
                     [class.dragging]="isDragging()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">
                  <input #fileInput type="file" accept=".xlsx,.xls,.xlsb,.csv,.txt,.dat" class="d-none" (change)="onFileSelected($event)">
                  <div class="py-3">
                    <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                    <h6 class="fw-bold mb-1">{{ ts.isRtl() ? 'اسحب كشف الحضور وأفلته هنا أو انقر للاختيار' : 'Drag & drop attendance sheet here or click to browse' }}</h6>
                    <p class="text-muted small mb-0">{{ ts.isRtl() ? 'الصيغ المدعومة: Excel (.xlsx, .xls, .xlsb)، CSV (.csv)، أو سجلات البصمة (.txt, .dat)' : 'Supported formats: Excel (.xlsx, .xls, .xlsb), CSV (.csv), or Biometric log files (.txt, .dat)' }}</p>
                  </div>
                </div>

                <!-- Selected File Display -->
                @if (selectedFile()) {
                  <div class="selected-file-card d-flex align-items-center justify-content-between p-3 rounded-3 bg-light mb-3">
                    <div class="d-flex align-items-center gap-3">
                      <i class="fas fs-3" [ngClass]="selectedFile()?.name?.endsWith('.csv') ? 'fa-file-csv text-primary' : 'fa-file-excel text-success'"></i>
                      <div>
                        <div class="fw-bold text-dark">{{ selectedFile()?.name }}</div>
                        <div class="text-muted small">{{ formatFileSize(selectedFile()?.size || 0) }}</div>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" (click)="clearSelectedFile()" [disabled]="uploading()">
                      <i class="fas fa-trash-alt me-1"></i>
                    </button>
                  </div>
                }

                <!-- Processing Summary if completed -->
                @if (uploadResult(); as res) {
                  <div class="upload-result-container mt-3">
                    <div class="alert alert-success d-flex align-items-center gap-2 mb-3 py-2">
                      <i class="fas fa-check-circle fs-5"></i>
                      <div>{{ res.message }}</div>
                    </div>

                    <div class="row g-2 mb-3">
                      <div class="col-3">
                        <div class="p-2 text-center rounded bg-light">
                          <div class="small text-muted">{{ ts.isRtl() ? 'الإجمالي' : 'Total' }}</div>
                          <div class="fs-5 fw-bold text-dark">{{ res.totalRows }}</div>
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="p-2 text-center rounded bg-success-subtle">
                          <div class="small text-success">{{ ts.isRtl() ? 'تم إنشاؤها' : 'Created' }}</div>
                          <div class="fs-5 fw-bold text-success">{{ res.createdCount }}</div>
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="p-2 text-center rounded bg-info-subtle">
                          <div class="small text-info">{{ ts.isRtl() ? 'تم تحديثها' : 'Updated' }}</div>
                          <div class="fs-5 fw-bold text-info">{{ res.updatedCount }}</div>
                        </div>
                      </div>
                      <div class="col-3">
                        <div class="p-2 text-center rounded bg-danger-subtle">
                          <div class="small text-danger">{{ ts.isRtl() ? 'فشلت' : 'Failed' }}</div>
                          <div class="fs-5 fw-bold text-danger">{{ res.failedCount }}</div>
                        </div>
                      </div>
                    </div>

                    @if (res.errors && res.errors.length > 0) {
                      <div class="card border-0 bg-light p-3">
                        <h6 class="fw-bold text-danger mb-2">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          {{ ts.isRtl() ? 'تفاصيل الأخطاء والتحذيرات' : 'Errors & Warnings' }} ({{ res.errors.length }})
                        </h6>
                        <div class="errors-list overflow-auto" style="max-height: 140px;">
                          @for (err of res.errors; track $index) {
                            <div class="small text-danger py-1 border-bottom border-light-subtle">
                              <strong>[Row {{ err.rowIndex }}]</strong> {{ err.error }}
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary" (click)="closeUploadModal()">
                  {{ ts.isRtl() ? 'إغلاق' : 'Close' }}
                </button>
                <button type="button" class="btn btn-primary d-flex align-items-center gap-2"
                        (click)="processUpload()"
                        [disabled]="!selectedFile() || uploading()">
                  @if (uploading()) {
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                  } @else {
                    <i class="fas fa-cogs"></i>
                  }
                  <span>{{ ts.isRtl() ? 'معالجة واستيراد الكشف' : 'Process & Import Sheet' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .attendance-page {
      padding: 0.5rem 0;
      font-family: inherit;
    }

    .view-tabs-bar .nav-link {
      color: var(--text-secondary);
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;

      &.active {
        background-color: var(--primary) !important;
        color: #fff !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      }
    }

    .badge-mini {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .matrix-table-container {
      overflow-x: auto;
      max-height: 650px;
      position: relative;
    }

    .matrix-table {
      font-size: 0.85rem;
      border-collapse: separate;
      border-spacing: 0;

      th, td {
        white-space: nowrap;
        vertical-align: middle;
      }

      thead th {
        position: sticky;
        top: 0;
        z-index: 15;
        background-color: var(--table-header-bg) !important;
      }

      .sticky-col-header, .sticky-col {
        position: sticky;
        inset-inline-start: 0;
        z-index: 10;
        min-width: 200px;
        max-width: 240px;
        border-inline-end: 2px solid var(--border-color);
      }

      .sticky-col-header {
        top: 0;
        z-index: 25;
        background-color: var(--table-header-bg) !important;
      }

      .sticky-col {
        background-color: var(--bg-surface) !important;
      }

      tbody tr:hover .sticky-col {
        background-color: var(--slate-100) !important;
      }

      .day-col {
        min-width: 44px;
        max-width: 48px;
        padding: 6px 2px;
      }

      .summary-col, .summary-cell {
        min-width: 65px;
        max-width: 80px;
      }

      .weekend-col, .weekend-cell {
        background-color: rgba(100, 116, 139, 0.08);
      }

      .cell-status {
        height: 38px;
      }
    }

    .hover-underline:hover {
      text-decoration: underline;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .upload-dropzone {
      border: 2px dashed var(--border-color);
      background-color: var(--bg-surface);
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      &:hover, &.dragging {
        border-color: var(--primary);
        background-color: var(--primary-subtle);
      }
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1050;
    }

    .modal {
      z-index: 1055;
    }

    .dropdown-menu {
      z-index: 1060;
    }
  `]
})
export class AttendanceComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  attendanceSvc = inject(AttendanceService);
  employeeService = inject(EmployeeService);
  departmentService = inject(DepartmentService);
  authService = inject(AuthService);
  datePipe = inject(DatePipe);

  // Active View Tab: 'daily' | 'monthly' | 'employee'
  activeTab = signal<'daily' | 'monthly' | 'employee'>('daily');

  // Daily Mode State
  selectedDate = signal<string>(this.formatDate(new Date()));
  dailySearchTerm = '';
  items = signal<any[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 100; // Show all daily employee records at once for great daily snapshot
  loading = signal(false);

  filters = { empId: '', from: '', to: '', status: '' };
  stats = signal<AttendanceSummary>({ present: 0, late: 0, absent: 0, onLeave: 0 });

  // Filtered daily items based on search input
  filteredDailyItems = computed(() => {
    const list = this.items();
    const term = this.dailySearchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(item =>
      (item.employeeName && item.employeeName.toLowerCase().includes(term)) ||
      (item.badgeNumber && item.badgeNumber.toLowerCase().includes(term)) ||
      String(item.employeeId).includes(term)
    );
  });

  // Monthly Matrix State
  matrixYear = new Date().getFullYear();
  matrixMonth = new Date().getMonth() + 1;
  matrixDeptId: number | undefined = undefined;
  isPayrollCycle = signal<boolean>(false);
  matrixData = signal<MonthlyAttendanceMatrix | null>(null);
  matrixLoading = signal<boolean>(false);

  // Employee Drill-down State
  drillEmployeeId: number | undefined = undefined;
  drillMonth = new Date().getMonth() + 1;
  drillYear = new Date().getFullYear();
  employeeRecords = signal<any[]>([]);
  tardinessSummary = signal<TardinessSummary | null>(null);
  employeeLoading = signal<boolean>(false);

  // Dropdown master lists
  employees = signal<any[]>([]);
  departments = signal<Department[]>([]);

  // Sheet Upload & Template Signals
  showUploadModal = signal(false);
  showTemplateMenu = signal(false);
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  uploadResult = signal<UploadAttendanceSheetResult | null>(null);
  isDragging = signal(false);

  monthsList = [
    { value: 1, nameAr: 'يناير (01)', nameEn: 'January (01)' },
    { value: 2, nameAr: 'فبراير (02)', nameEn: 'February (02)' },
    { value: 3, nameAr: 'مارس (03)', nameEn: 'March (03)' },
    { value: 4, nameAr: 'أبريل (04)', nameEn: 'April (04)' },
    { value: 5, nameAr: 'مايو (05)', nameEn: 'May (05)' },
    { value: 6, nameAr: 'يونيو (06)', nameEn: 'June (06)' },
    { value: 7, nameAr: 'يوليو (07)', nameEn: 'July (07)' },
    { value: 8, nameAr: 'أغسطس (08)', nameEn: 'August (08)' },
    { value: 9, nameAr: 'سبتمبر (09)', nameEn: 'September (09)' },
    { value: 10, nameAr: 'أكتوبر (10)', nameEn: 'October (10)' },
    { value: 11, nameAr: 'نوفمبر (11)', nameEn: 'November (11)' },
    { value: 12, nameAr: 'ديسمبر (12)', nameEn: 'December (12)' }
  ];

  ngOnInit() {
    this.loadEmployees();
    this.loadDepartments();
    
    // Set default daily anchor to TODAY
    this.filters.from = this.selectedDate();
    this.filters.to = this.selectedDate();
    this.loadData(1);
  }

  loadEmployees() {
    if (this.authService.isHR()) {
      this.employeeService.getAll(1, 1000).subscribe({
        next: (res: any) => {
          this.employees.set(res.data?.items || []);
        },
        error: () => {}
      });
    }
  }

  loadDepartments() {
    if (this.authService.isHR()) {
      this.departmentService.getAll(1, 100).subscribe({
        next: (res: any) => {
          this.departments.set(res.data?.items || []);
        },
        error: () => {}
      });
    }
  }

  switchTab(tab: 'daily' | 'monthly' | 'employee') {
    this.activeTab.set(tab);
    if (tab === 'monthly' && !this.matrixData()) {
      this.loadMonthlyMatrix();
    } else if (tab === 'employee' && this.drillEmployeeId && this.employeeRecords().length === 0) {
      this.loadEmployeeTimesheet();
    }
  }

  // ─── Daily Mode Methods ──────────────────────────────────────────────────

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(newDate: string) {
    if (newDate) {
      this.selectedDate.set(newDate);
      this.filters.from = newDate;
      this.filters.to = newDate;
      this.loadData(1);
    }
  }

  navigateDay(delta: number) {
    const cur = new Date(this.selectedDate());
    cur.setDate(cur.getDate() + delta);
    const newDateStr = this.formatDate(cur);
    this.onDateChange(newDateStr);
  }

  goToToday() {
    const todayStr = this.formatDate(new Date());
    this.onDateChange(todayStr);
  }

  loadData(pageIndex: number = 1) {
    this.page.set(pageIndex);
    this.loading.set(true);
    const empId = this.authService.isHR()
      ? (Number(this.filters.empId) || undefined)
      : (this.authService.getEmployeeId() || undefined);

    this.attendanceSvc.getAll(
      this.page(),
      this.pageSize,
      empId,
      this.filters.from,
      this.filters.to,
      this.filters.status
    ).subscribe({
      next: (res: any) => {
        const list = res.data?.items || (Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []));
        this.items.set(list);
        this.totalCount.set((res.data?.totalCount || res.totalCount) || 0);

        if (res.data?.summary) {
          this.stats.set(res.data.summary);
        } else {
          let present = 0, late = 0, absent = 0, onLeave = 0;
          for (const item of list) {
            const resolved = this.resolveItemStatus(item);
            if (resolved === 'onLeave') onLeave++;
            else if (resolved === 'present') present++;
            else if (resolved === 'late') late++;
            else if (resolved === 'absent') absent++;
          }
          this.stats.set({ present, late, absent, onLeave });
        }

        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.t().common?.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }

  resetFilters() {
    this.dailySearchTerm = '';
    this.filters.status = '';
    this.filters.empId = '';
    this.loadData(1);
  }

  // ─── Monthly Matrix Mode Methods ─────────────────────────────────────────

  togglePayrollCycle() {
    this.isPayrollCycle.update(v => !v);
    this.loadMonthlyMatrix();
  }

  loadMonthlyMatrix() {
    this.matrixLoading.set(true);
    this.attendanceSvc.getMonthlyMatrix(
      Number(this.matrixYear),
      Number(this.matrixMonth),
      this.matrixDeptId,
      this.isPayrollCycle()
    ).subscribe({
      next: (res) => {
        this.matrixData.set(res.data || null);
        this.matrixLoading.set(false);
      },
      error: (err) => {
        this.matrixLoading.set(false);
        this.toast.show(err.error?.message || 'Failed to load monthly matrix', 'error');
      }
    });
  }

  // ─── Employee Timesheet Drill-Down Methods ───────────────────────────────

  drillDownEmployee(empId: number) {
    this.drillEmployeeId = empId;
    this.switchTab('employee');
    this.loadEmployeeTimesheet();
  }

  loadEmployeeTimesheet() {
    if (!this.drillEmployeeId) return;

    this.employeeLoading.set(true);

    // Calculate month boundary
    const y = Number(this.drillYear);
    const m = Number(this.drillMonth);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 1. Fetch employee daily records
    this.attendanceSvc.getByEmployee(this.drillEmployeeId, startDate, endDate, 1, 31).subscribe({
      next: (res: any) => {
        const list = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.employeeRecords.set(list);
        this.employeeLoading.set(false);
      },
      error: () => {
        this.employeeLoading.set(false);
      }
    });

    // 2. Fetch employee tardiness breakdown
    this.attendanceSvc.getTardiness(this.drillEmployeeId, y, m).subscribe({
      next: (res) => {
        this.tardinessSummary.set(res.data || null);
      },
      error: () => {
        this.tardinessSummary.set(null);
      }
    });
  }

  // ─── Shared Utilities ────────────────────────────────────────────────────

  resolveItemStatus(item: any): 'present' | 'late' | 'absent' | 'onLeave' | 'weekend' {
    const note = (item.note || '').toLowerCase();
    const s = String(item.status ?? '').toLowerCase();

    if (note.includes('عطلة') || note.includes('weekend') || note.includes('جمعة') || note.includes('friday') || note.includes('سبت') || note.includes('saturday')) {
      return 'weekend';
    }
    if (s.includes('leave') || s === '4' || note.includes('إجازة') || note.includes('أجازة') || note.includes('اجازة') || note.includes('leave')) {
      return 'onLeave';
    }
    if (s.includes('late') || s === '2' || (item.lateMinutes && item.lateMinutes > 0)) {
      return 'late';
    }
    if (s.includes('present') || s === '0' || item.clockIn) {
      return 'present';
    }
    if (s.includes('absent') || s === '1') {
      return 'absent';
    }
    return 'absent';
  }

  // ─── Sheet Upload & Template Methods ────────────────────────────────────

  toggleTemplateMenu() {
    this.showTemplateMenu.update(v => !v);
  }

  downloadTemplate(format: 'excel' | 'csv') {
    this.showTemplateMenu.set(false);
    this.attendanceSvc.downloadTemplate(format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'excel' ? 'Attendance_Import_Template.xlsx' : 'Attendance_Import_Template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toast.show(this.ts.t().common?.error || 'Failed to download template', 'error');
      }
    });
  }

  openUploadModal() {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.showUploadModal.set(true);
  }

  closeUploadModal() {
    this.showUploadModal.set(false);
    this.selectedFile.set(null);
    this.uploadResult.set(null);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeUploadModal();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.uploadResult.set(null);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
      this.uploadResult.set(null);
    }
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
  }

  processUpload() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.attendanceSvc.uploadAttendanceSheet(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.data) {
          this.uploadResult.set(res.data);
          this.toast.show(this.ts.t().attendance?.uploadSuccess || 'Sheet processed successfully', 'success');
          // Refresh data in current tab
          if (this.activeTab() === 'daily') {
            this.loadData(1);
          } else if (this.activeTab() === 'monthly') {
            this.loadMonthlyMatrix();
          }
        }
      },
      error: (err) => {
        this.uploading.set(false);
        const errorMsg = err.error?.message || err.message || (this.ts.t().common?.error || 'Failed to process sheet');
        this.toast.show(errorMsg, 'error');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
