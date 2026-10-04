import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { PayrollService } from '../../core/services/payroll.service';

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="salary-container" [dir]="isRtl() ? 'rtl' : 'ltr'">
      <div class="header d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center gap-3">
          <div class="icon-wrapper">
            <i class="fas fa-sitemap"></i>
          </div>
          <h1 class="mb-0">{{ t().salaryStructure?.title || 'Salary Structure' }}</h1>
        </div>
        <button class="btn btn-primary premium-btn" (click)="toggleForm()">
          <i class="fas" [ngClass]="showForm() ? 'fa-times' : 'fa-plus'"></i> 
          <span class="ms-2 me-2">{{ showForm() ? (t().common?.cancel || 'Cancel') : (t().common?.add || 'Add New') }}</span>
        </button>
      </div>

      <div class="card premium-card mb-4 slide-down" *ngIf="showForm()">
        <div class="card-body">
          <h5 class="card-title mb-4">{{ editingId() ? (t().common?.edit || 'Edit') : (t().common?.add || 'Add') }}</h5>
          <form (ngSubmit)="saveStructure()" #form="ngForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">{{ t().salaryStructure?.employeeId || 'Employee ID' }}</label>
                <input type="text" class="form-control custom-input" name="employeeId" [(ngModel)]="currentForm.employeeId" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">{{ t().salaryStructure?.basicSalary || 'Basic Salary' }}</label>
                <input type="number" class="form-control custom-input" name="basicSalary" [(ngModel)]="currentForm.basicSalary" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">{{ t().salaryStructure?.housingAllowance || 'Housing Allowance' }}</label>
                <input type="number" class="form-control custom-input" name="housingAllowance" [(ngModel)]="currentForm.housingAllowance">
              </div>
              <div class="col-md-6">
                <label class="form-label">{{ t().salaryStructure?.transportAllowance || 'Transport Allowance' }}</label>
                <input type="number" class="form-control custom-input" name="transportAllowance" [(ngModel)]="currentForm.transportAllowance">
              </div>
            </div>
            <div class="mt-4 text-end">
              <button type="submit" class="btn btn-success premium-btn" [disabled]="form.invalid">
                <i class="fas fa-save me-2"></i> {{ t().common?.save || 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card premium-card table-card">
        <div class="table-responsive">
          <table class="table premium-table mb-0">
            <thead>
              <tr>
                <th>{{ t().salaryStructure?.employeeId || 'Employee ID' }}</th>
                <th>{{ t().salaryStructure?.basicSalary || 'Basic Salary' }}</th>
                <th>{{ t().salaryStructure?.housingAllowance || 'Housing' }}</th>
                <th>{{ t().salaryStructure?.transportAllowance || 'Transport' }}</th>
                <th class="text-end">{{ t().common?.actions || 'Actions' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of structures()">
                <td><span class="badge bg-light text-dark fw-bold">{{ item.employeeId }}</span></td>
                <td class="fw-semibold">{{ item.basicSalary | number }}</td>
                <td>{{ item.housingAllowance | number }}</td>
                <td>{{ item.transportAllowance | number }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-icon text-primary me-2" (click)="editStructure(item)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-icon text-danger" (click)="deleteStructure(item.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="structures().length === 0">
                <td colspan="5" class="text-center empty-state py-5">
                  <i class="fas fa-box-open mb-3 empty-icon"></i>
                  <p class="text-muted">{{ t().common?.noData || 'No data available.' }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .salary-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--font-primary, 'Inter', sans-serif);
    }
    .salary-container[dir="rtl"] {
      font-family: var(--font-arabic, 'Cairo', sans-serif);
    }
    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
    }
    .premium-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .slide-down {
      animation: slideDown 0.3s ease-out forwards;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .form-label {
      font-weight: 600;
      color: #475569;
      font-size: 0.9rem;
    }
    .custom-input {
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 0.75rem 1rem;
      background: transparent;
      transition: all 0.2s;
    }
    .custom-input:focus {
      background: var(--bg-surface-solid, #ffffff);
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      outline: none;
    }
    .premium-btn {
      border-radius: 8px;
      padding: 0.6rem 1.5rem;
      font-weight: 600;
      border: none;
      transition: all 0.2s;
      color: white;
    }
    .btn-primary.premium-btn {
      background: #3b82f6;
    }
    .btn-primary.premium-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
    .btn-success.premium-btn {
      background: #10b981;
    }
    .btn-success.premium-btn:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
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
    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: transparent;
      border: none;
      cursor: pointer;
    }
    .btn-icon:hover {
      background: #f1f5f9;
    }
    .btn-icon.text-danger:hover {
      background: #fee2e2;
    }
    .empty-icon {
      font-size: 3rem;
      color: #cbd5e1;
    }
    [dir="rtl"] .text-end { text-align: left !important; }
    [dir="rtl"] .ms-2 { margin-right: 0.5rem !important; margin-left: 0 !important; }
    [dir="rtl"] .me-2 { margin-left: 0.5rem !important; margin-right: 0 !important; }
  `]
})
export class SalaryStructureComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  payrollService = inject(PayrollService);

  t = computed(() => this.ts.t());
  isRtl = computed(() => this.ts.isRtl());

  structures = signal<any[]>([]);
  showForm = signal<boolean>(false);
  editingId = signal<string | null>(null);

  currentForm = {
    employeeId: '',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0
  };

  ngOnInit() {
    this.loadStructures();
  }

  loadStructures() {
    this.payrollService.getSalaryStructures().subscribe({
      next: (res: any) => {
        this.structures.set((Array.isArray(res.data) ? res.data : (res.data?.items || res.items || [])));
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
    this.editingId.set(item.id);
    this.currentForm = { ...item };
    this.showForm.set(true);
  }

  resetForm() {
    this.editingId.set(null);
    this.currentForm = { employeeId: '', basicSalary: 0, housingAllowance: 0, transportAllowance: 0 };
  }

  saveStructure() {
    const ob$ = this.editingId() 
      ? this.payrollService.updateSalaryStructure(Number(this.editingId()!), this.currentForm)
      : this.payrollService.createSalaryStructure(this.currentForm);

    ob$.subscribe({
      next: () => {
        this.toast.show(this.t().common?.saveSuccess || 'Saved successfully.', 'success');
        this.loadStructures();
        this.toggleForm();
      },
      error: () => {
        this.toast.show(this.t().common?.saveError || 'Failed to save.', 'error');
      }
    });
  }

  deleteStructure(id: string) {
    if (confirm(this.t().common?.confirmDelete || 'Are you sure you want to delete?')) {
      this.payrollService.deleteSalaryStructure(Number(id)).subscribe({
        next: () => {
          this.toast.show(this.t().common?.deleteSuccess || 'Deleted successfully.', 'success');
          this.loadStructures();
        },
        error: () => {
          this.toast.show(this.t().common?.deleteError || 'Failed to delete.', 'error');
        }
      });
    }
  }
}
