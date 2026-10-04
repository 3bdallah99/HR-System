import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { PayrollService } from '../../core/services/payroll.service';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payslip-container" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="header">
        <h1>{{ t().payroll?.payslipsTitle || 'Payslips' }}</h1>
      </div>

      <div class="card premium-card mb-4 filter-card">
        <div class="card-body">
          <div class="row align-items-end g-3">
            <div class="col-md-4">
              <label class="form-label">{{ t().payroll?.month || 'Month' }}</label>
              <select class="form-select custom-select" [(ngModel)]="month">
                <option *ngFor="let m of months" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ t().payroll?.year || 'Year' }}</label>
              <input type="number" class="form-control custom-input" [(ngModel)]="year">
            </div>
            <div class="col-md-4">
              <button class="btn btn-primary premium-btn w-100" (click)="loadPayslips()">
                <i class="fas fa-search me-2"></i> {{ t().payroll?.searchBtn || 'Search' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card premium-card table-card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table premium-table mb-0">
              <thead>
                <tr>
                  <th>{{ t().payroll?.employee || 'Employee' }}</th>
                  <th>{{ t().payroll?.period || 'Period' }}</th>
                  <th>{{ t().payroll?.basic || 'Basic' }}</th>
                  <th>{{ t().payroll?.deductions || 'Deductions' }}</th>
                  <th>{{ t().payroll?.netSalary || 'Net Salary' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of payslips()">
                  <td>
                    <div class="employee-info">
                      <div class="avatar"><i class="fas fa-user"></i></div>
                      <span>{{ item.employeeName || item.employeeId }}</span>
                    </div>
                  </td>
                  <td>{{ item.month }}/{{ item.year }}</td>
                  <td>{{ item.basicSalary | number }}</td>
                  <td>{{ item.deductions | number }}</td>
                  <td class="net-salary">{{ item.netSalary | number }}</td>
                </tr>
                <tr *ngIf="payslips().length === 0">
                  <td colspan="5" class="text-center empty-state">
                    <i class="fas fa-file-invoice mb-3 empty-icon"></i>
                    <p>{{ t().payroll?.noData || 'No payslips found for this period.' }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payslip-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--font-primary, 'Inter', sans-serif);
    }
    .payslip-container[dir="rtl"] {
      font-family: var(--font-arabic, 'Cairo', sans-serif);
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 2rem;
    }
    .premium-card {
      background: var(--bg-surface-solid, #ffffff);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .filter-card .card-body { padding: 1.5rem; }
    .form-label {
      font-weight: 600;
      color: #475569;
      font-size: 0.9rem;
    }
    .custom-input, .custom-select {
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 0.6rem 1rem;
      background: white;
    }
    .custom-input:focus, .custom-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      outline: none;
    }
    .premium-btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.5rem;
      font-weight: 600;
      height: 42px;
      transition: all 0.2s;
    }
    .premium-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }
    .premium-table {
      margin-bottom: 0;
    }
    .premium-table th {
      background: transparent;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 1rem 1.5rem;
      border-bottom: 2px solid #e2e8f0;
    }
    .premium-table td {
      padding: 1rem 1.5rem;
      vertical-align: middle;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .employee-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .net-salary {
      font-weight: 700;
      color: #10b981;
    }
    .empty-state {
      padding: 4rem 2rem !important;
      color: #94a3b8;
    }
    .empty-icon {
      font-size: 3rem;
      color: #cbd5e1;
    }
    [dir="rtl"] .me-2 {
      margin-left: 0.5rem !important;
      margin-right: 0 !important;
    }
  `]
})
export class PayslipListComponent implements OnInit {
  ts = inject(TranslationService);
  payrollService = inject(PayrollService);

  t = computed(() => this.ts.t());
  isRtl = computed(() => this.ts.isRtl());

  months = Array.from({length: 12}, (_, i) => i + 1);
  month = signal<number>(new Date().getMonth() + 1);
  year = signal<number>(new Date().getFullYear());
  
  payslips = signal<any[]>([]);

  ngOnInit() {
    this.loadPayslips();
  }

  loadPayslips() {
    this.payrollService.getPayslips(this.month(), this.year()).subscribe({
      next: (res: any) => {
        this.payslips.set((Array.isArray(res.data) ? res.data : (res.data?.items || res.items || [])));
      }
    });
  }
}
