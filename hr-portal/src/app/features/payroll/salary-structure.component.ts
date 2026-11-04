import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="salary-structure-page" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="hr-page-header">
        <div class="header-content">
          <h2 class="header-title">
            <i class="fas fa-sliders-h"></i>
            <span>{{ t().salaryStructure?.title || (isRtl() ? 'هياكل الرواتب' : 'Salary Structures') }}</span>
          </h2>
          <p class="header-subtitle">
            {{ isRtl() ? 'تهيئة الرواتب الأساسية، البدلات، والاستقطاعات للموظفين' : 'Configure base salaries, allowances, and fixed deductions' }}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="toggleForm()">
            <i class="fas" [ngClass]="showForm() ? 'fa-times' : 'fa-plus'"></i> 
            <span>{{ showForm() ? (t().common?.cancel || (isRtl() ? 'إلغاء' : 'Cancel')) : (t().salaryStructure?.addNew || (isRtl() ? 'إضافة هيكل جديد' : 'Add Structure')) }}</span>
          </button>
        </div>
      </div>

      <!-- Add/Edit Form Card -->
      <div class="card premium-card mb-4 slide-down" *ngIf="showForm()">
        <div class="card-body p-4">
          <h5 class="card-title fw-bold mb-4 d-flex align-items-center gap-2">
            <i class="fas" [ngClass]="editingId() ? 'fa-edit text-primary' : 'fa-plus-circle text-success'"></i>
            {{ editingId() ? (t().salaryStructure?.editStructure || 'Edit Salary Structure') : (t().salaryStructure?.addNew || 'New Salary Structure') }}
          </h5>

          <form (ngSubmit)="saveStructure()" #form="ngForm">
            <div class="row g-3">
              <!-- Employee Selection -->
              <div class="col-md-12">
                <label class="form-label">{{ t().salaryStructure?.employeeId || 'Employee' }} <span class="text-danger">*</span></label>
                <select class="form-select custom-select" name="employeeId" [(ngModel)]="currentForm.employeeId" required [disabled]="editingId() !== null">
                  <option [ngValue]="null" disabled>{{ t().salaryStructure?.selectEmployee || 'Select Employee...' }}</option>
                  <option *ngFor="let emp of employees()" [ngValue]="emp.id">
                    {{ emp.name }} (#{{ emp.id }}) {{ emp.departmentName ? '— ' + emp.departmentName : '' }}
                  </option>
                </select>
              </div>

              <!-- Earnings Column -->
              <div class="col-md-6">
                <div class="p-3 rounded-3 bg-light border border-light-subtle h-100">
                  <h6 class="fw-bold text-success mb-3">
                    <i class="fas fa-plus-circle me-1"></i> {{ t().salaryStructure?.totalEarnings || 'Earnings & Allowances' }}
                  </h6>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.basicSalary || 'Basic Salary' }} <span class="text-danger">*</span></label>
                    <input type="number" class="form-control custom-input" name="basicSalary" [(ngModel)]="currentForm.basicSalary" (wheel)="$any($event.target).blur()" required min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.housingAllowance || 'Housing Allowance' }}</label>
                    <input type="number" class="form-control custom-input" name="housingAllowance" [(ngModel)]="currentForm.housingAllowance" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.transportAllowance || 'Transport Allowance' }}</label>
                    <input type="number" class="form-control custom-input" name="transportationAllowance" [(ngModel)]="currentForm.transportationAllowance" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.mealAllowance || 'Meal Allowance' }}</label>
                    <input type="number" class="form-control custom-input" name="mealAllowance" [(ngModel)]="currentForm.mealAllowance" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.otherAllowances || 'Other Allowances' }}</label>
                    <input type="number" class="form-control custom-input" name="otherAllowances" [(ngModel)]="currentForm.otherAllowances" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-2">
                    <label class="form-label small">{{ t().salaryStructure?.overtimePay || 'Overtime Pay' }}</label>
                    <input type="number" class="form-control custom-input" name="overtimePay" [(ngModel)]="currentForm.overtimePay" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                </div>
              </div>

              <!-- Deductions Column -->
              <div class="col-md-6">
                <div class="p-3 rounded-3 bg-light border border-light-subtle h-100">
                  <h6 class="fw-bold text-danger mb-3">
                    <i class="fas fa-minus-circle me-1"></i> {{ t().salaryStructure?.totalDeductions || 'Fixed Deductions' }}
                  </h6>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.socialInsurance || 'Social Insurance' }}</label>
                    <input type="number" class="form-control custom-input" name="socialInsurance" [(ngModel)]="currentForm.socialInsurance" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.taxAmount || 'Income Tax' }}</label>
                    <input type="number" class="form-control custom-input" name="taxAmount" [(ngModel)]="currentForm.taxAmount" (wheel)="$any($event.target).blur()" min="0">
                  </div>
                  <div class="mb-3">
                    <label class="form-label small">{{ t().salaryStructure?.otherDeductions || 'Other Deductions' }}</label>
                    <input type="number" class="form-control custom-input" name="otherDeductions" [(ngModel)]="currentForm.otherDeductions" (wheel)="$any($event.target).blur()" min="0">
                  </div>

                  <!-- Summary Box in Form -->
                  <div class="card border-0 bg-white shadow-sm p-3 mt-4">
                    <div class="d-flex justify-content-between text-muted small mb-1">
                      <span>{{ t().salaryStructure?.totalEarnings || 'Total Earnings' }}:</span>
                      <strong class="text-success">{{ computedTotalEarnings() | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                    </div>
                    <div class="d-flex justify-content-between text-muted small mb-2">
                      <span>{{ t().salaryStructure?.totalDeductions || 'Total Deductions' }}:</span>
                      <strong class="text-danger">{{ computedTotalDeductions() | number:'1.2-2' }} {{ currency.currencySymbol() }}</strong>
                    </div>
                    <hr class="my-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="fw-bold">{{ t().salaryStructure?.estimatedNet || 'Estimated Net Pay' }}:</span>
                      <span class="fs-5 fw-bold text-primary">{{ computedNetPay() | number:'1.2-2' }} {{ currency.currencySymbol() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-outline-secondary" (click)="toggleForm()">
                {{ t().common?.cancel || 'Cancel' }}
              </button>
              <button type="submit" class="btn btn-success premium-btn" [disabled]="form.invalid || saving() || !currentForm.employeeId">
                <i class="fas" [ngClass]="saving() ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                <span class="ms-2 me-2">{{ t().common?.save || 'Save Structure' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Structures Table Card -->
      <div class="hr-table-card">
        <div class="table-responsive">
          <table class="hr-table align-middle">
            <thead>
              <tr>
                <th>{{ t().salaryStructure?.employeeId || (isRtl() ? 'الموظف' : 'Employee') }}</th>
                <th class="text-num">{{ t().salaryStructure?.basicSalary || (isRtl() ? 'الأساسي' : 'Basic Salary') }}</th>
                <th class="text-num">{{ t().salaryStructure?.housingAllowance || (isRtl() ? 'البدلات' : 'Allowances') }}</th>
                <th class="text-num">{{ t().salaryStructure?.totalDeductions || (isRtl() ? 'الاستقطاعات' : 'Deductions') }}</th>
                <th class="text-num">{{ t().salaryStructure?.estimatedNet || (isRtl() ? 'الصافي التقديري' : 'Estimated Net') }}</th>
                <th class="text-end">{{ t().common?.actions || (isRtl() ? 'الإجراءات' : 'Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
              } @else if (structures().length === 0) {
                <tr>
                  <td colspan="6" class="text-center empty-state py-5">
                    <i class="fas fa-sitemap fa-3x mb-3 text-muted opacity-50 d-block"></i>
                    <p class="text-muted mb-0">{{ t().salaryStructure?.noSalaryStructures || (isRtl() ? 'لا توجد هياكل رواتب مسجلة حتى الآن.' : 'No salary structures registered yet.') }}</p>
                  </td>
                </tr>
              } @else {
                @for (item of structures(); track item.employeeId) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <span class="hr-badge badge-neutral">#{{ item.employeeId }}</span>
                        <span class="fw-semibold">{{ item.employeeName || (isRtl() ? 'موظف #' + item.employeeId : 'Employee #' + item.employeeId) }}</span>
                      </div>
                    </td>
                    <td class="text-num hr-currency fw-semibold">{{ item.basicSalary | number:'1.2-2' }}</td>
                    <td class="text-num">
                      <span class="text-success fw-semibold hr-currency">+{{ (item.totalEarnings - item.basicSalary) | number:'1.2-2' }}</span>
                    </td>
                    <td class="text-num">
                      <span class="text-danger fw-semibold hr-currency">-{{ item.totalFixedDeductions | number:'1.2-2' }}</span>
                    </td>
                    <td class="text-num">
                      <span class="hr-currency text-success fs-6 fw-bold">
                        {{ item.estimatedGross | number:'1.2-2' }} {{ currency.currencySymbol() }}
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary me-2" (click)="editStructure(item)" title="Edit">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteStructure(item.employeeId)" title="Delete">
                        <i class="fas fa-trash"></i>
                      </button>
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
    .salary-structure-page {
      padding: 0.5rem 0;
      font-family: inherit;
    }
    .slide-down {
      animation: slideDown 0.3s ease-out forwards;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SalaryStructureComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  payrollService = inject(PayrollService);
  employeeService = inject(EmployeeService);
  currency = inject(CurrencyService);

  t = computed(() => this.ts.t());
  isRtl = computed(() => this.ts.isRtl());

  structures = signal<any[]>([]);
  employees = signal<any[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingId = signal<number | null>(null);

  currentForm = {
    employeeId: null as number | null,
    basicSalary: 0,
    housingAllowance: 0,
    transportationAllowance: 0,
    mealAllowance: 0,
    otherAllowances: 0,
    overtimePay: 0,
    socialInsurance: 0,
    taxAmount: 0,
    otherDeductions: 0
  };

  computedTotalEarnings = computed(() => {
    return Number(this.currentForm.basicSalary || 0) +
           Number(this.currentForm.housingAllowance || 0) +
           Number(this.currentForm.transportationAllowance || 0) +
           Number(this.currentForm.mealAllowance || 0) +
           Number(this.currentForm.otherAllowances || 0) +
           Number(this.currentForm.overtimePay || 0);
  });

  computedTotalDeductions = computed(() => {
    return Number(this.currentForm.socialInsurance || 0) +
           Number(this.currentForm.taxAmount || 0) +
           Number(this.currentForm.otherDeductions || 0);
  });

  computedNetPay = computed(() => {
    return this.computedTotalEarnings() - this.computedTotalDeductions();
  });

  ngOnInit() {
    this.loadStructures();
    this.loadEmployees();
  }

  loadStructures() {
    this.loading.set(true);
    this.payrollService.getAllSalaryStructures().subscribe({
      next: (res: any) => {
        this.structures.set(Array.isArray(res.data) ? res.data : (res.data?.items || []));
        this.loading.set(false);
      },
      error: () => {
        this.structures.set([]);
        this.loading.set(false);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getAll(1, 100).subscribe({
      next: (res: any) => {
        this.employees.set(res.data?.items || (Array.isArray(res.data) ? res.data : []));
      }
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  editStructure(item: any) {
    this.editingId.set(item.employeeId);
    this.currentForm = {
      employeeId: item.employeeId,
      basicSalary: item.basicSalary,
      housingAllowance: item.housingAllowance,
      transportationAllowance: item.transportationAllowance,
      mealAllowance: item.mealAllowance,
      otherAllowances: item.otherAllowances,
      overtimePay: item.overtimePay,
      socialInsurance: item.socialInsurance,
      taxAmount: item.taxAmount,
      otherDeductions: item.otherDeductions
    };
    this.showForm.set(true);
  }

  resetForm() {
    this.editingId.set(null);
    this.currentForm = {
      employeeId: null,
      basicSalary: 0,
      housingAllowance: 0,
      transportationAllowance: 0,
      mealAllowance: 0,
      otherAllowances: 0,
      overtimePay: 0,
      socialInsurance: 0,
      taxAmount: 0,
      otherDeductions: 0
    };
  }

  saveStructure() {
    if (!this.currentForm.employeeId) return;

    this.saving.set(true);
    const ob$ = this.editingId() 
      ? this.payrollService.updateSalaryStructure(this.editingId()!, this.currentForm)
      : this.payrollService.createSalaryStructure(this.currentForm);

    ob$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(this.t().common?.saveSuccess || 'Saved successfully.', 'success');
        this.loadStructures();
        this.toggleForm();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err.error?.message || (this.t().common?.saveError || 'Failed to save.'), 'error');
      }
    });
  }

  deleteStructure(employeeId: number) {
    if (confirm(this.t().common?.confirmDelete || 'Are you sure you want to delete this salary structure?')) {
      this.payrollService.deleteSalaryStructure(employeeId).subscribe({
        next: () => {
          this.toast.show(this.t().common?.deleteSuccess || 'Deleted successfully.', 'success');
          this.loadStructures();
        },
        error: (err) => {
          this.toast.show(err.error?.message || (this.t().common?.deleteError || 'Failed to delete.'), 'error');
        }
      });
    }
  }
}
