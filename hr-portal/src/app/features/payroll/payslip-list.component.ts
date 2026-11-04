import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { PayrollService } from '../../core/services/payroll.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payslip-page" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="hr-page-header">
        <div class="header-content">
          <h2 class="header-title">
            <i class="fas fa-file-invoice-dollar"></i>
            <span>{{ t().payroll?.payslipsTitle || (isRtl() ? 'قسائم الرواتب الشهرية' : 'Monthly Payslips') }}</span>
          </h2>
          <p class="header-subtitle">
            {{ isRtl() ? 'استعراض ومراجعة وطباعة قسائم رواتب الموظفين المحتسبة' : 'Review, inspect, and print computed employee payslips' }}
          </p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="hr-filter-bar mb-4" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="form-group">
          <label class="form-label text-secondary small fw-semibold">{{ t().payroll?.month || (isRtl() ? 'الشهر' : 'Month') }}</label>
          <select class="form-select" [ngModel]="month()" (ngModelChange)="month.set(+$event)">
            <option *ngFor="let m of months" [value]="m">
              {{ m }} - {{ getMonthName(m) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label text-secondary small fw-semibold">{{ t().payroll?.year || (isRtl() ? 'السنة' : 'Year') }}</label>
          <input type="number" class="form-control" [ngModel]="year()" (ngModelChange)="year.set(+$event)" (wheel)="$any($event.target).blur()" min="2020" max="2035">
        </div>

        <div class="filter-actions">
          <button class="btn btn-primary w-100" (click)="loadPayslips()" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm" role="status"></span>
            } @else {
              <i class="fas fa-search"></i>
            }
            <span>{{ t().payroll?.searchBtn || (isRtl() ? 'بحث ومراجعة' : 'Search & Review') }}</span>
          </button>
        </div>
      </div>

      <!-- Dynamic Payroll Cycle Range Notice -->
      <div class="d-flex align-items-center gap-2 mb-4 p-3 rounded" style="background: var(--primary-subtle); border: 1px solid var(--primary-light);">
        <i class="fas fa-calendar-alt text-primary"></i>
        <span class="small fw-semibold text-primary">{{ cycleRange() }}</span>
      </div>

      <!-- Summary KPI Widgets (if data exists) -->
      @if (summary()) {
        <div class="hr-stats-grid mb-4">
          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ t().payroll?.totalProcessed || (isRtl() ? 'إجمالي الموظفين' : 'Employees') }}</span>
              <span class="stat-value text-primary">{{ summary()?.totalEmployees || 0 }}</span>
            </div>
            <div class="stat-icon icon-info">
              <i class="fas fa-users"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ t().payroll?.totalGross || (isRtl() ? 'إجمالي المستحقات' : 'Total Gross') }}</span>
              <span class="stat-value text-success hr-currency">{{ summary()?.totalGrossPay | number:'1.2-2' }}</span>
            </div>
            <div class="stat-icon icon-success">
              <i class="fas fa-wallet"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ t().payroll?.totalDeductions || (isRtl() ? 'إجمالي الخصومات' : 'Total Deductions') }}</span>
              <span class="stat-value text-danger hr-currency">{{ summary()?.totalDeductions | number:'1.2-2' }}</span>
            </div>
            <div class="stat-icon icon-danger">
              <i class="fas fa-file-invoice-dollar"></i>
            </div>
          </div>

          <div class="hr-stat-card">
            <div class="stat-info">
              <span class="stat-label">{{ t().payroll?.totalNet || (isRtl() ? 'صافي الرواتب' : 'Total Net Pay') }}</span>
              <span class="stat-value text-primary hr-currency">{{ summary()?.totalNetPay | number:'1.2-2' }} {{ currency.currencySymbol() }}</span>
            </div>
            <div class="stat-icon icon-info">
              <i class="fas fa-money-check-alt"></i>
            </div>
          </div>
        </div>
      }

      <!-- Payslips Table Card -->
      <div class="hr-table-card">
        <div class="table-responsive">
          <table class="hr-table align-middle">
            <thead>
              <tr>
                <th>{{ t().payroll?.employee || (isRtl() ? 'الموظف' : 'Employee') }}</th>
                <th class="text-num">{{ t().payroll?.basic || (isRtl() ? 'الراتب الأساسي' : 'Basic Salary') }}</th>
                <th class="text-num">{{ t().payroll?.gross || (isRtl() ? 'المستحق' : 'Gross Pay') }}</th>
                <th class="text-num">{{ t().payroll?.deductions || (isRtl() ? 'الاستقطاعات' : 'Deductions') }}</th>
                <th class="text-num">{{ t().payroll?.netSalary || (isRtl() ? 'صافي الراتب' : 'Net Salary') }}</th>
                <th>{{ t().payroll?.daysPresent || (isRtl() ? 'الحضور' : 'Attendance') }}</th>
                <th class="text-end">{{ t().payroll?.actions || (isRtl() ? 'الإجراءات' : 'Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
              } @else if (payslips().length === 0) {
                <tr>
                  <td colspan="7" class="text-center empty-state py-5">
                    <i class="fas fa-file-invoice fa-3x mb-3 text-muted opacity-50 d-block"></i>
                    <p class="text-muted mb-0">{{ t().payroll?.noData || (isRtl() ? 'لا توجد قسائم رواتب مسجلة لهذه الفترة. قم بتشغيل مسير الرواتب أولاً.' : 'No payslips found for this period. Run payroll first.') }}</p>
                  </td>
                </tr>
              } @else {
                @for (item of payslips(); track item.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div>
                          <div class="fw-bold">{{ item.employeeName || (isRtl() ? 'موظف #' + item.employeeId : 'Employee #' + item.employeeId) }}</div>
                          <div class="text-muted small">
                            {{ item.departmentName || '' }} {{ item.positionTitle ? '• ' + item.positionTitle : '' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="text-num hr-currency">{{ item.basicSalary | number:'1.2-2' }}</td>
                    <td class="text-num">
                      <span class="text-success fw-semibold hr-currency">{{ item.grossPay | number:'1.2-2' }}</span>
                      @if (item.overtimePay > 0) {
                        <span class="hr-badge badge-success ms-1 small">+{{ item.overtimePay }}</span>
                      }
                    </td>
                    <td class="text-num">
                      <span class="text-danger fw-semibold hr-currency">-{{ item.totalDeductions | number:'1.2-2' }}</span>
                      @if (item.absenceDeduction > 0 || item.tardinessDeduction > 0) {
                        <div class="text-muted small" style="font-size: 0.75rem;">
                          {{ item.absenceDeduction > 0 ? (isRtl() ? 'غياب: ' : 'Absence: ') + item.absenceDeduction : '' }}
                          {{ item.tardinessDeduction > 0 ? (isRtl() ? ' تأخير: ' : ' Tardy: ') + item.tardinessDeduction : '' }}
                        </div>
                      }
                    </td>
                    <td class="text-num">
                      <span class="hr-currency text-success fs-6 fw-bold">
                        {{ item.netPay | number:'1.2-2' }} {{ currency.currencySymbol() }}
                      </span>
                    </td>
                    <td>
                      <span class="hr-badge badge-neutral">
                        <i class="fas fa-check-circle text-success me-1"></i>{{ item.daysPresent }}d
                      </span>
                      @if (item.daysAbsent > 0) {
                        <span class="hr-badge badge-danger ms-1">
                          {{ item.daysAbsent }}d abs
                        </span>
                      }
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" (click)="openDetail(item)">
                        <i class="fas fa-eye me-1"></i> {{ t().payroll?.viewDetails || (isRtl() ? 'التفاصيل' : 'Details') }}
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payslip Detail Modal -->
      @if (selectedSlip(); as slip) {
        <div class="modal-backdrop fade show"></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="onBackdropClick($event)">
          <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden printable-area">
              <div class="modal-header bg-light border-0 py-3 px-4">
                <h5 class="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                  <i class="fas fa-file-invoice text-primary fs-4"></i>
                  {{ t().payroll?.payslipDetails || 'Itemized Payslip' }} — {{ month() }}/{{ year() }}
                </h5>
                <button type="button" class="btn-close" (click)="closeDetail()" aria-label="Close"></button>
              </div>

              <div class="modal-body p-4">
                <!-- Employee Header in Slip -->
                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4">
                  <div>
                    <h5 class="fw-bold mb-1">{{ slip.employeeName }}</h5>
                    <div class="text-muted small">
                      <span class="badge bg-primary me-2">ID: #{{ slip.employeeId }}</span>
                      {{ slip.departmentName }} • {{ slip.positionTitle }}
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="text-muted small">{{ t().payroll?.period || 'Payment Date' }}</div>
                    <div class="fw-bold">{{ slip.paymentDate | date:'mediumDate' }}</div>
                  </div>
                </div>

                <div class="row g-4">
                  <!-- Earnings Column -->
                  <div class="col-md-6">
                    <div class="p-3 border rounded-3 h-100">
                      <h6 class="fw-bold text-success border-bottom pb-2 mb-3">
                        <i class="fas fa-plus-circle me-1"></i> {{ t().payroll?.gross || 'Earnings' }}
                      </h6>
                      <div class="d-flex justify-content-between py-1">
                        <span class="text-muted">{{ t().payroll?.basic || 'Basic Salary' }}</span>
                        <strong>{{ slip.basicSalary | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1">
                        <span class="text-muted">{{ t().payroll?.overtime || 'Overtime Pay' }}</span>
                        <strong class="text-success">+{{ slip.overtimePay | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-top mt-2 pt-2 fw-bold">
                        <span>{{ t().payroll?.gross || 'Total Gross' }}</span>
                        <span class="text-success">{{ slip.grossPay | number:'1.2-2' }} {{ currency.currencySymbol() }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Deductions Column -->
                  <div class="col-md-6">
                    <div class="p-3 border rounded-3 h-100">
                      <h6 class="fw-bold text-danger border-bottom pb-2 mb-3">
                        <i class="fas fa-minus-circle me-1"></i> {{ t().payroll?.deductions || 'Deductions' }}
                      </h6>
                      <div class="d-flex justify-content-between py-1">
                        <span class="text-muted">{{ t().payroll?.absenceDeduction || 'Absence Deduction' }}</span>
                        <strong class="text-danger">-{{ slip.absenceDeduction | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1">
                        <span class="text-muted">{{ t().payroll?.tardinessDeduction || 'Tardiness Deduction' }}</span>
                        <strong class="text-danger">-{{ slip.tardinessDeduction | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                      </div>
                      <div class="d-flex justify-content-between py-1 border-top mt-2 pt-2 fw-bold">
                        <span>{{ t().payroll?.deductions || 'Total Deductions' }}</span>
                        <span class="text-danger">-{{ slip.totalDeductions | number:'1.2-2' }} {{ currency.currencySymbol() }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Net Pay Banner -->
                <div class="p-3 rounded-3 mt-4 text-center" style="background: var(--success-bg); border: 1px solid var(--success-border);">
                  <div class="text-success small fw-bold text-uppercase">{{ t().payroll?.netSalary || (isRtl() ? 'صافي المبلغ المصروف' : 'Net Amount Disbursed') }}</div>
                  <div class="display-6 fw-bold text-success hr-currency">{{ slip.netPay | number:'1.2-2' }} {{ currency.currencySymbol() }}</div>
                </div>
              </div>

              <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary" (click)="closeDetail()">
                  {{ t().common?.close || (isRtl() ? 'إغلاق' : 'Close') }}
                </button>
                <button type="button" class="btn btn-primary d-flex align-items-center gap-2" (click)="printSlip()">
                  <i class="fas fa-print"></i>
                  <span>{{ t().payroll?.printPayslip || (isRtl() ? 'طباعة القسيمة' : 'Print Payslip') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payslip-page {
      padding: 0.5rem 0;
      font-family: inherit;
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

    @media print {
      body * {
        visibility: hidden;
      }
      .printable-area, .printable-area * {
        visibility: visible;
      }
      .printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .modal-footer {
        display: none !important;
      }
    }
  `]
})
export class PayslipListComponent implements OnInit {
  ts = inject(TranslationService);
  payrollService = inject(PayrollService);
  authService = inject(AuthService);
  currency = inject(CurrencyService);

  t = computed(() => this.ts.t());
  isRtl = computed(() => this.ts.isRtl());

  months = Array.from({length: 12}, (_, i) => i + 1);
  month = signal<number>(new Date().getMonth() + 1);
  year = signal<number>(new Date().getFullYear());
  
  payslips = signal<any[]>([]);
  summary = signal<any | null>(null);
  loading = signal<boolean>(false);
  selectedSlip = signal<any | null>(null);

  cycleRange = computed(() => {
    const m = this.month();
    const y = this.year();
    if (!m || !y) return '';
    let prevM = m - 1;
    let prevY = y;
    if (prevM === 0) {
      prevM = 12;
      prevY = y - 1;
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `26/${pad(prevM)}/${prevY}`;
    const endStr = `25/${pad(m)}/${y}`;
    if (this.isRtl()) {
      return `الدورة المالية: ${startStr} إلى ${endStr}`;
    }
    return `Payroll Cycle: ${startStr} to ${endStr}`;
  });

  ngOnInit() {
    this.loadPayslips();
  }

  loadPayslips() {
    this.loading.set(true);

    if (this.authService.isHR()) {
      this.payrollService.getPayslips(this.month(), this.year()).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          const data = res.data;
          if (data) {
            this.summary.set({
              totalBasicSalary: data.totalBasicSalary,
              totalGrossPay: data.totalGrossPay,
              totalOvertimePay: data.totalOvertimePay,
              totalDeductions: data.totalDeductions,
              totalNetPay: data.totalNetPay,
              totalEmployees: data.totalEmployees
            });
            // Match 'payslips', 'slips', 'items', or array
            const list = data.payslips || data.slips || data.items || (Array.isArray(data) ? data : []);
            this.payslips.set(list);
          } else {
            this.summary.set(null);
            this.payslips.set([]);
          }
        },
        error: () => {
          this.loading.set(false);
          this.summary.set(null);
          this.payslips.set([]);
        }
      });
    } else {
      const empId = this.authService.getEmployeeId();
      if (!empId) {
        this.loading.set(false);
        this.summary.set(null);
        this.payslips.set([]);
        return;
      }

      this.payrollService.getByEmployee(empId, this.year()).subscribe({
        next: (res: any) => {
          this.loading.set(false);
          const raw = res.data?.items || (Array.isArray(res.data) ? res.data : (res.items || []));
          const listWithMeta = raw.map((item: any) => ({
            ...item,
            employeeId: item.employeeId || empId,
            employeeName: item.employeeName || (this.authService.currentUser()?.email?.split('@')?.[0] || `Employee #${empId}`)
          }));
          const filtered = listWithMeta.filter((item: any) => item.month === this.month());
          const displayList = filtered.length > 0 ? filtered : (this.month() ? [] : listWithMeta);
          this.payslips.set(displayList);

          if (displayList.length > 0) {
            const totalGross = displayList.reduce((sum: number, s: any) => sum + (s.grossPay || 0), 0);
            const totalDeductions = displayList.reduce((sum: number, s: any) => sum + (s.totalDeductions || 0), 0);
            const totalNet = displayList.reduce((sum: number, s: any) => sum + (s.netPay || 0), 0);
            this.summary.set({
              totalBasicSalary: displayList[0]?.basicSalary || 0,
              totalGrossPay: totalGross,
              totalOvertimePay: displayList[0]?.overtimePay || 0,
              totalDeductions: totalDeductions,
              totalNetPay: totalNet,
              totalEmployees: 1
            });
          } else {
            this.summary.set(null);
          }
        },
        error: () => {
          this.loading.set(false);
          this.summary.set(null);
          this.payslips.set([]);
        }
      });
    }
  }

  openDetail(slip: any) {
    this.selectedSlip.set(slip);
  }

  closeDetail() {
    this.selectedSlip.set(null);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeDetail();
    }
  }

  printSlip() {
    window.print();
  }

  getMonthName(m: number): string {
    const names = [
      'January / يناير', 'February / فبراير', 'March / مارس', 'April / أبريل',
      'May / مايو', 'June / يونيو', 'July / يوليو', 'August / أغسطس',
      'September / سبتمبر', 'October / أكتوبر', 'November / نوفمبر', 'December / ديسمبر'
    ];
    return names[m - 1] || `${m}`;
  }
}
