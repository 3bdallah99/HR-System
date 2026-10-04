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
    <div class="payroll-run-container" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="header">
        <div class="icon-wrapper">
          <i class="fas fa-play-circle"></i>
        </div>
        <h1>{{ t().payroll?.runTitle || 'Run Payroll' }}</h1>
      </div>

      <div class="card premium-card">
        <div class="card-body">
          <div class="row align-items-end g-3">
            <div class="col-md-5">
              <label class="form-label">{{ t().payroll?.month || 'Month' }}</label>
              <select class="form-select custom-select" [(ngModel)]="month">
                <option *ngFor="let m of months" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label">{{ t().payroll?.year || 'Year' }}</label>
              <input type="number" class="form-control custom-input" [(ngModel)]="year">
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary w-100 premium-btn d-inline-flex align-items-center justify-content-center text-nowrap" [disabled]="isRunning()" (click)="runPayroll()">
                <ng-container *ngIf="!isRunning()">
                  <i class="fas fa-cogs"></i>
                  <span>{{ t().payroll?.runBtn || 'Run' }}</span>
                </ng-container>
                <ng-container *ngIf="isRunning()">
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>{{ t().payroll?.running || 'Running...' }}</span>
                </ng-container>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payroll-run-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      font-family: var(--font-primary, 'Inter', sans-serif);
    }
    .payroll-run-container[dir="rtl"] {
      font-family: var(--font-arabic, 'Cairo', sans-serif);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }
    .premium-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .premium-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    }
    .card-body {
      padding: 2rem;
    }
    .form-label {
      font-weight: 600;
      color: var(--text-secondary, #475569);
      margin-bottom: 0.5rem;
    }
    .custom-input, .custom-select {
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 0.75rem 1rem;
      transition: all 0.2s ease;
      background: white;
    }
    .custom-input:focus, .custom-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      outline: none;
    }
    .premium-btn {
      border-radius: 8px;
      padding: 0.6rem 1rem;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      border: none;
      font-weight: 600;
      transition: all 0.3s ease;
      min-height: 46px;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
    }
    .premium-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #4338ca, #4f46e5);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
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
