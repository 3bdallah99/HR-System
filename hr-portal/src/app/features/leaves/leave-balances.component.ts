import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-leave-balances',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container" [dir]="ts.isRtl() ? 'rtl' : 'ltr'" [class.rtl]="ts.isRtl()">
      <!-- Page Header -->
      <div class="hr-page-header mb-4">
        <div class="header-content">
          <h2 class="page-title mb-0">
            <i class="fas fa-scale-balanced text-primary me-2"></i>
            {{ ts.t().leaveBalances?.title || ts.t().nav?.leaveBalances || (ts.isRtl() ? 'أرصدة الإجازات' : 'Leave Balances') }}
          </h2>
          <p class="page-subtitle mb-0">{{ ts.t().leaveBalances?.subtitle || (ts.isRtl() ? 'استعراض الحصص المخصصة والمستهلكة والمتبقية من الإجازات' : 'View your allocated, used, and remaining leave days') }}</p>
        </div>
      </div>

      <!-- Balance Cards Grid (Overview) -->
      <div class="hr-stats-grid mb-4" *ngIf="!loading() && items().length > 0">
        <div class="hr-stat-card" *ngFor="let item of items()">
          <div class="stat-icon text-primary bg-primary bg-opacity-10">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ item.leaveType }}</span>
            <span class="stat-value financial-num text-success">{{ item.remainingDays || 0 }}</span>
            <span class="stat-sub text-muted">
              {{ ts.isRtl() ? 'متبقي من إجمالي' : 'left of' }} {{ item.totalDays || 0 }} {{ ts.isRtl() ? 'يوم' : 'days' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="hr-table-card mb-4">
        <div class="table-responsive">
          <table class="hr-table">
            <thead>
              <tr>
                <th>{{ ts.t().leaves?.leaveType || (ts.isRtl() ? 'نوع الإجازة' : 'Leave Type') }}</th>
                <th class="text-center">{{ ts.t().leaveBalances?.totalDays || (ts.isRtl() ? 'إجمالي الحصة' : 'Total Days') }}</th>
                <th class="text-center">{{ ts.t().leaveBalances?.usedDays || (ts.isRtl() ? 'المستهلك' : 'Used Days') }}</th>
                <th class="text-center">{{ ts.t().leaveBalances?.remainingDays || (ts.isRtl() ? 'الرصيد المتبقي' : 'Remaining Days') }}</th>
                <th>{{ ts.isRtl() ? 'نسبة الاستهلاك' : 'Utilization' }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr>
                  <td colspan="5" class="text-center py-5">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span class="text-muted small">{{ ts.isRtl() ? 'جاري التحميل...' : 'Loading...' }}</span>
                  </td>
                </tr>
              } @else if (items().length === 0) {
                <tr>
                  <td colspan="5" class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i><br>
                    {{ ts.t().leaveBalances?.noBalancesFound || ts.t().common?.noData || (ts.isRtl() ? 'لا توجد أرصدة إجازة متاحة' : 'No Balances Found') }}
                  </td>
                </tr>
              } @else {
                @for (item of items(); track item.id || item.leaveType) {
                  <tr>
                    <td>
                      <span class="hr-badge badge-neutral">
                        {{ item.leaveType }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span class="financial-num fw-bold">{{ item.totalDays || 0 }}</span>
                    </td>
                    <td class="text-center">
                      <span class="hr-badge badge-danger financial-num">{{ item.usedDays || 0 }}</span>
                    </td>
                    <td class="text-center">
                      <span class="hr-badge badge-success financial-num">{{ item.remainingDays || 0 }}</span>
                    </td>
                    <td style="min-width: 140px;">
                      <div class="progress rounded-pill bg-light" style="height: 8px;">
                        <div
                          class="progress-bar rounded-pill"
                          [ngClass]="item.remainingDays > 5 ? 'bg-success' : (item.remainingDays > 0 ? 'bg-warning' : 'bg-danger')"
                          [style.width.%]="item.totalDays > 0 ? ((item.remainingDays / item.totalDays) * 100) : 0"></div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem 0;
      background-color: transparent;
      font-family: inherit;
    }
  `]
})
export class LeaveBalancesComponent {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  leaveSvc = inject(LeaveService);
  authService = inject(AuthService);
  
  items = signal<any[]>([]);
  loading = signal(false);

  constructor() {
    this.loadData();
  }

  loadData() {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    this.leaveSvc.getBalances(empId).subscribe({
      next: (res: any) => {
        this.items.set((Array.isArray(res.data) ? res.data : (res.data?.items || [])));
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.t().common?.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }
}
