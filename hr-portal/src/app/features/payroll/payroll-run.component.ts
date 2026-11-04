import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { PayrollService } from '../../core/services/payroll.service';

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-run-page" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="hr-page-header">
        <div class="header-content">
          <h2 class="header-title">
            <i class="fas fa-play-circle"></i>
            <span>{{ t().payroll?.runTitle || (isRtl() ? 'إجراء مسير الرواتب' : 'Run Payroll') }}</span>
          </h2>
          <p class="header-subtitle">
            {{ isRtl() ? 'معالجة واحتساب مسير الرواتب الشهري لجميع الموظفين' : 'Process and calculate monthly payroll for all employees' }}
          </p>
        </div>
      </div>

      <div class="card border-0 shadow-sm p-4" style="max-width: 800px; margin: 0 auto; background: var(--bg-surface);">
        <div class="row align-items-end g-3">
          <div class="col-12 col-md-5">
            <label class="form-label fw-semibold text-secondary small">{{ t().payroll?.month || (isRtl() ? 'الشهر' : 'Month') }}</label>
            <select class="form-select" [ngModel]="month()" (ngModelChange)="month.set(+$event)" style="height: 42px;">
              <option *ngFor="let m of months" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label fw-semibold text-secondary small">{{ t().payroll?.year || (isRtl() ? 'السنة' : 'Year') }}</label>
            <input type="number" class="form-control" [ngModel]="year()" (ngModelChange)="year.set(+$event)" (wheel)="$any($event.target).blur()" style="height: 42px;">
          </div>
          <div class="col-12 col-md-3">
            <button class="btn btn-primary w-100 d-flex align-items-center justify-content-center text-nowrap gap-2"
                    [disabled]="isRunning()" (click)="runPayroll()" style="height: 42px;">
              <ng-container *ngIf="!isRunning()">
                <i class="fas fa-cogs"></i>
                <span>{{ t().payroll?.runBtn || (isRtl() ? 'تشغيل' : 'Run') }}</span>
              </ng-container>
              <ng-container *ngIf="isRunning()">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>{{ t().payroll?.running || (isRtl() ? 'جاري التشغيل...' : 'Running...') }}</span>
              </ng-container>
            </button>
          </div>
        </div>
        <!-- Dynamic Payroll Cycle Range Notice -->
        <div class="d-flex align-items-center gap-2 mt-4 p-3 rounded" style="background: var(--primary-subtle); border: 1px solid var(--primary-light);">
          <i class="fas fa-calendar-alt text-primary"></i>
          <span class="small fw-semibold text-primary">{{ cycleRange() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payroll-run-page {
      padding: 0.5rem 0;
      font-family: inherit;
    }
  `]
})
export class PayrollRunComponent {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  payrollService = inject(PayrollService);

  t = computed(() => this.ts.t());
  isRtl = computed(() => this.ts.isRtl());

  months = Array.from({length: 12}, (_, i) => i + 1);
  month = signal<number>(new Date().getMonth() + 1);
  year = signal<number>(new Date().getFullYear());
  isRunning = signal<boolean>(false);

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

  runPayroll() {
    this.isRunning.set(true);
    this.payrollService.runPayroll(this.month(), this.year()).subscribe({
      next: () => {
        this.isRunning.set(false);
        this.toast.show(this.t().payroll?.runSuccess || 'Payroll run completed successfully.', 'success');
      },
      error: () => {
        this.isRunning.set(false);
        this.toast.show(this.t().payroll?.runError || 'Failed to run payroll.', 'error');
      }
    });
  }
}
