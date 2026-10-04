import fs from 'fs';

// ==============================================================
// 1. REWRITE src/app/features/employees/employee-list.component.ts
// ==============================================================
const employeeListComponent = `import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { PositionService } from '../../core/services/position.service';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: \`
    <div class="page-container animate-fade-in-up" [class.rtl]="ts.isRtl()">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="page-title fw-bold mb-1 text-dark">{{ ts.t()?.employees?.title || 'الموظفون' }}</h2>
          <p class="text-muted mb-0">{{ ts.t()?.employees?.subtitle || 'إدارة سجلات وبيانات الموظفين' }}</p>
        </div>
        <button class="btn btn-primary btn-premium rounded-pill px-4 shadow-sm" (click)="toggleForm()">
          <i class="fas fa-plus" [class.ms-2]="ts.isRtl()" [class.me-2]="!ts.isRtl()"></i>
          {{ ts.t()?.common?.add || 'إضافة موظف' }}
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container mb-4 ms-auto" style="max-width: 450px;">
        <div class="input-group glass-input-group shadow-sm">
          <span class="input-group-text border-0">
            <i class="fas fa-search text-muted"></i>
          </span>
          <input type="text" class="form-control border-0 py-3" [placeholder]="ts.t()?.common?.search || 'بحث بالاسم...'"
                 [value]="searchTerm()" (input)="updateSearch($event)">
        </div>
      </div>

      <!-- Form Card (Slide in/out) -->
      <div class="form-card-container mb-4" [class.show]="showForm()">
        <div class="card premium-card border-0 shadow-sm">
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-4">
              {{ editingId() ? (ts.t()?.common?.edit || 'تعديل') : (ts.t()?.common?.add || 'إضافة') }} {{ ts.t()?.employees?.singular || 'موظف' }}
            </h5>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="row g-3">
                <!-- Name -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control" id="name" formControlName="name" placeholder="الاسم بالكامل">
                    <label for="name">{{ ts.isRtl() ? 'الاسم بالكامل' : 'Full Name' }} *</label>
                  </div>
                </div>

                <!-- Email -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="email" class="form-control" id="email" formControlName="email" placeholder="البريد الإلكتروني">
                    <label for="email">{{ ts.isRtl() ? 'البريد الإلكتروني' : 'Email' }} *</label>
                  </div>
                </div>

                <!-- Phone -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control" id="phone" formControlName="phone" placeholder="رقم الهاتف">
                    <label for="phone">{{ ts.isRtl() ? 'رقم الهاتف' : 'Phone' }} *</label>
                  </div>
                </div>

                <!-- Address -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control" id="address" formControlName="address" placeholder="العنوان">
                    <label for="address">{{ ts.isRtl() ? 'العنوان' : 'Address' }} *</label>
                  </div>
                </div>

                <!-- Hire Date -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="date" class="form-control" id="hireDate" formControlName="hireDate" placeholder="تاريخ التعيين">
                    <label for="hireDate">{{ ts.isRtl() ? 'تاريخ التعيين' : 'Hire Date' }} *</label>
                  </div>
                </div>

                <!-- Department Dropdown -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <select class="form-select" id="departmentId" formControlName="departmentId" (change)="onDepartmentChange()">
                      <option [ngValue]="null" disabled selected>{{ ts.isRtl() ? '-- اختر القسم --' : '-- Select Department --' }}</option>
                      @for (dept of departments(); track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                    <label for="departmentId">{{ ts.isRtl() ? 'القسم' : 'Department' }} *</label>
                  </div>
                </div>

                <!-- Position Dropdown -->
                <div class="col-md-6">
                  <div class="form-floating">
                    <select class="form-select" id="positionId" formControlName="positionId">
                      <option [ngValue]="null" disabled selected>{{ ts.isRtl() ? '-- اختر المنصب الوظيفي --' : '-- Select Position --' }}</option>
                      @for (pos of filteredPositions(); track pos.id) {
                        <option [value]="pos.id">{{ pos.title }} ({{ pos.departmentName || pos.baseSalary + ' EGP' }})</option>
                      }
                    </select>
                    <label for="positionId">{{ ts.isRtl() ? 'المنصب الوظيفي' : 'Position' }} *</label>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="d-flex justify-content-end mt-4 gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" (click)="toggleForm()">
                  {{ ts.t()?.common?.cancel || 'إلغاء' }}
                </button>
                <button type="submit" class="btn btn-primary btn-premium rounded-pill px-4" [disabled]="form.invalid || submitting()">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="submitting()"></i>
                  {{ ts.t()?.common?.save || 'حفظ' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card premium-card border-0 shadow-sm overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'الموظف' : 'Employee' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'القسم' : 'Department' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'المنصب' : 'Position' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'البريد الإلكتروني' : 'Email' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'رقم الهاتف' : 'Phone' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'تاريخ التعيين' : 'Hire Date' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'الراتب الأساسي' : 'Base Salary' }}</th>
                <th class="py-3 px-4 text-end">{{ ts.t()?.common?.actions || 'الإجراءات' }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Skeleton Loading -->
              <ng-container *ngIf="loading()">
                <tr *ngFor="let i of [1,2,3,4,5]">
                  <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-100"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                  <td class="px-4 py-3 text-end"><div class="skeleton-text w-50 d-inline-block"></div></td>
                </tr>
              </ng-container>

              <!-- Data Rows -->
              <ng-container *ngIf="!loading() && data().length > 0">
                <tr *ngFor="let item of data()">
                  <td class="px-4 py-3 fw-medium">
                    <div class="d-flex align-items-center">
                      <div class="avatar-circle me-3" [class.ms-3]="ts.isRtl()" [class.me-3]="!ts.isRtl()">
                        {{ getInitials(item.name) }}
                      </div>
                      <div>
                        <div class="fw-bold">{{ item.name }}</div>
                        <small class="text-muted">{{ item.address }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-muted">
                    <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded">
                      {{ item.departmentName || '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-muted">
                    <span class="badge bg-info bg-opacity-10 text-info px-2 py-1 rounded">
                      {{ item.positionTitle || '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-muted">{{ item.email }}</td>
                  <td class="px-4 py-3 text-muted">{{ item.phone }}</td>
                  <td class="px-4 py-3 text-muted">{{ item.hireDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-3 text-muted fw-bold">{{ item.baseSalary | currency }}</td>
                  <td class="px-4 py-3 text-end">
                    <button class="btn btn-sm btn-icon btn-light me-2 rounded-circle transition-all" (click)="edit(item)" title="تعديل">
                      <i class="fas fa-edit text-primary"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-light rounded-circle transition-all" (click)="delete(item.id)" title="حذف">
                      <i class="fas fa-trash text-danger"></i>
                    </button>
                  </td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="!loading() && data().length === 0">
                <td colspan="8" class="text-center py-5">
                  <div class="empty-state">
                    <div class="empty-icon-wrapper mx-auto mb-3">
                      <i class="fas fa-users text-muted fa-3x"></i>
                    </div>
                    <h5 class="fw-bold text-dark">{{ ts.t()?.common?.noData || 'لا توجد بيانات' }}</h5>
                    <p class="text-muted">{{ ts.t()?.common?.noDataDesc || 'لم يتم العثور على أي موظفين تطابق معايير البحث.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer border-0 py-3 d-flex justify-content-between align-items-center" *ngIf="!loading() && totalCount() > 0">
          <span class="text-muted small">
            {{ ts.isRtl() ? 'إجمالي الموظفين:' : 'Total Employees:' }} {{ totalCount() }}
          </span>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" [disabled]="page() === 1" (click)="prevPage()">
              <i class="fas fa-chevron-right" *ngIf="ts.isRtl()"></i>
              <i class="fas fa-chevron-left" *ngIf="!ts.isRtl()"></i>
            </button>
            <span class="d-flex align-items-center px-2 small">{{ page() }}</span>
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" (click)="nextPage()">
              <i class="fas fa-chevron-left" *ngIf="ts.isRtl()"></i>
              <i class="fas fa-chevron-right" *ngIf="!ts.isRtl()"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  \`,
  styles: [\`
    .page-container {
      padding: 1.5rem 0;
      background-color: transparent;
      font-family: inherit;
    }
    .rtl {
      direction: rtl;
    }
    .rtl .text-end { text-align: left !important; }

    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .premium-card {
      background: var(--bg-surface-solid, #ffffff);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      transition: all 0.3s ease;
    }
    .premium-card:hover {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }

    .btn-premium {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: white;
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      color: white;
    }

    .glass-input-group {
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .form-card-container {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    .form-card-container.show {
      max-height: 1000px;
      opacity: 1;
      margin-bottom: 1.5rem;
      overflow: visible;
    }

    .skeleton-text {
      height: 1rem;
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 0.25rem;
    }
    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-circle {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: #4338ca;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .rtl .form-floating > label {
      left: auto;
      right: 0;
      transform-origin: top right;
    }
    .rtl .form-floating > .form-control:focus ~ label,
    .rtl .form-floating > .form-control:not(:placeholder-shown) ~ label,
    .rtl .form-floating > .form-select ~ label {
      transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
    }
  \`]
})
export class EmployeeListComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  svc = inject(EmployeeService);
  deptSvc = inject(DepartmentService);
  posSvc = inject(PositionService);
  fb = inject(FormBuilder);

  data = signal<any[]>([]);
  departments = signal<any[]>([]);
  positions = signal<any[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  submitting = signal(false);
  searchTerm = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  page = signal(1);
  pageSize = signal(10);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    hireDate: ['', Validators.required],
    departmentId: [null, Validators.required],
    positionId: [null, Validators.required]
  });

  filteredPositions = computed(() => {
    const selectedDeptId = this.form.get('departmentId')?.value;
    if (!selectedDeptId) return this.positions();
    return this.positions().filter(p => !p.departmentId || p.departmentId === Number(selectedDeptId));
  });

  ngOnInit() {
    this.loadData();
    this.loadDropdowns();
  }

  loadDropdowns() {
    // Load Departments
    this.deptSvc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.departments.set(items);
      }
    });

    // Load Positions
    this.posSvc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.positions.set(items);
      }
    });
  }

  onDepartmentChange() {
    // Reset position if no longer matching
    const currentPosId = this.form.get('positionId')?.value;
    const available = this.filteredPositions();
    if (currentPosId && !available.some(p => p.id === currentPosId)) {
      this.form.get('positionId')?.setValue(null);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadData() {
    this.loading.set(true);
    this.svc.getAll(this.page(), this.pageSize()).subscribe({
      next: (res: any) => {
        let items = (res.data?.items || (Array.isArray(res.data) ? res.data : (res.data?.items || res.items || [])));
        const term = this.searchTerm().toLowerCase();
        if (term) {
          items = items.filter((emp: any) => 
            emp.name?.toLowerCase().includes(term) ||
            emp.email?.toLowerCase().includes(term) ||
            emp.phone?.includes(term)
          );
        }
        this.data.set(items);
        this.totalCount.set((res.data?.totalCount || res.totalCount) || items.length);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.t()?.common?.errorFetching || 'فشل تحميل بيانات الموظفين', 'error');
        this.loading.set(false);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadData();
  }

  toggleForm() {
    if (this.showForm()) {
      this.closeForm();
    } else {
      this.showForm.set(true);
    }
  }

  closeForm() {
    this.showForm.set(false);
    this.form.reset();
    this.editingId.set(null);
  }

  edit(item: any) {
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      hireDate: item.hireDate ? item.hireDate.substring(0, 10) : '',
      departmentId: item.departmentId,
      positionId: item.positionId
    });
    this.showForm.set(true);
  }

  delete(id: number) {
    const msg = this.ts.isRtl() ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?';
    if (confirm(msg)) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.toast.show(this.ts.isRtl() ? 'تم حذف الموظف بنجاح' : 'Employee deleted successfully', 'success');
          this.loadData();
        },
        error: () => {
          this.toast.show(this.ts.isRtl() ? 'فشل حذف الموظف' : 'Failed to delete employee', 'error');
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const id = this.editingId();
    const payload = {
      ...this.form.value,
      departmentId: Number(this.form.value.departmentId),
      positionId: Number(this.form.value.positionId)
    };

    const req = id ? this.svc.update(id, payload) : this.svc.create(payload);

    (req as any).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم حفظ بيانات الموظف بنجاح' : 'Employee saved successfully', 'success');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || (this.ts.isRtl() ? 'فشل حفظ الموظف' : 'Failed to save employee'), 'error');
        this.submitting.set(false);
      }
    });
  }

  nextPage() {
    this.page.set(this.page() + 1);
    this.loadData();
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadData();
    }
  }
}
`;

fs.writeFileSync('e:/ITI/APIs/HR/hr-portal/src/app/features/employees/employee-list.component.ts', employeeListComponent);
console.log('✓ Successfully rewrote employee-list.component.ts with dynamic dropdowns and full API compatibility');

// ==============================================================
// 2. REWRITE src/app/features/positions/position-list.component.ts
// ==============================================================
const positionListComponent = `import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PositionService } from '../../core/services/position.service';
import { DepartmentService } from '../../core/services/department.service';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-position-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: \`
    <div class="page-container animate-fade-in-up" [class.rtl]="ts.isRtl()">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="page-title fw-bold mb-1 text-dark">{{ ts.t()?.positions?.title || 'المناصب الوظيفية' }}</h2>
          <p class="text-muted mb-0">{{ ts.t()?.positions?.subtitle || 'إدارة المناصب الوظيفية وهياكل الرواتب الأساسية' }}</p>
        </div>
        <button class="btn btn-primary btn-premium rounded-pill px-4 shadow-sm" (click)="toggleForm()">
          <i class="fas fa-plus" [class.ms-2]="ts.isRtl()" [class.me-2]="!ts.isRtl()"></i>
          {{ ts.t()?.common?.add || 'إضافة منصب' }}
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container mb-4 ms-auto" style="max-width: 450px;">
        <div class="input-group glass-input-group shadow-sm">
          <span class="input-group-text border-0">
            <i class="fas fa-search text-muted"></i>
          </span>
          <input type="text" class="form-control border-0 py-3" [placeholder]="ts.t()?.common?.search || 'بحث في المناصب...'"
                 [value]="searchTerm()" (input)="updateSearch($event)">
        </div>
      </div>

      <!-- Form Card (Slide in/out) -->
      <div class="form-card-container mb-4" [class.show]="showForm()">
        <div class="card premium-card border-0 shadow-sm">
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-4">
              {{ editingId() ? (ts.t()?.common?.edit || 'تعديل') : (ts.t()?.common?.add || 'إضافة') }} {{ ts.t()?.positions?.singular || 'منصب وظيفي' }}
            </h5>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="row g-3">
                <!-- Title -->
                <div class="col-md-4">
                  <div class="form-floating">
                    <input type="text" class="form-control" id="title" formControlName="title" placeholder="المسمى الوظيفي">
                    <label for="title">{{ ts.isRtl() ? 'المسمى الوظيفي' : 'Job Title' }} *</label>
                  </div>
                </div>

                <!-- Department Dropdown -->
                <div class="col-md-4">
                  <div class="form-floating">
                    <select class="form-select" id="departmentId" formControlName="departmentId">
                      <option [ngValue]="null" disabled selected>{{ ts.isRtl() ? '-- اختر القسم --' : '-- Select Department --' }}</option>
                      @for (dept of departments(); track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                    <label for="departmentId">{{ ts.isRtl() ? 'القسم التابع له' : 'Department' }} *</label>
                  </div>
                </div>

                <!-- Base Salary -->
                <div class="col-md-4">
                  <div class="form-floating">
                    <input type="number" class="form-control" id="baseSalary" formControlName="baseSalary" placeholder="الراتب الأساسي">
                    <label for="baseSalary">{{ ts.isRtl() ? 'الراتب الأساسي' : 'Base Salary' }} *</label>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="d-flex justify-content-end mt-4 gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" (click)="toggleForm()">
                  {{ ts.t()?.common?.cancel || 'إلغاء' }}
                </button>
                <button type="submit" class="btn btn-primary btn-premium rounded-pill px-4" [disabled]="form.invalid || submitting()">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="submitting()"></i>
                  {{ ts.t()?.common?.save || 'حفظ' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card premium-card border-0 shadow-sm overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'المسمى الوظيفي' : 'Job Title' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'القسم' : 'Department' }}</th>
                <th class="py-3 px-4">{{ ts.isRtl() ? 'الراتب الأساسي' : 'Base Salary' }}</th>
                <th class="py-3 px-4 text-end">{{ ts.t()?.common?.actions || 'الإجراءات' }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Skeleton Loading -->
              <ng-container *ngIf="loading()">
                <tr *ngFor="let i of [1,2,3]">
                  <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                  <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                  <td class="px-4 py-3 text-end"><div class="skeleton-text w-50 d-inline-block"></div></td>
                </tr>
              </ng-container>

              <!-- Data Rows -->
              <ng-container *ngIf="!loading() && filteredData().length > 0">
                <tr *ngFor="let item of filteredData()">
                  <td class="px-4 py-3 fw-bold">
                    <div class="d-flex align-items-center">
                      <div class="icon-circle me-3" [class.ms-3]="ts.isRtl()" [class.me-3]="!ts.isRtl()">
                        <i class="fas fa-briefcase"></i>
                      </div>
                      {{ item.title }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                      {{ item.departmentName || '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 fw-bold text-success">
                    {{ item.baseSalary | currency }}
                  </td>
                  <td class="px-4 py-3 text-end">
                    <button class="btn btn-sm btn-icon btn-light me-2 rounded-circle transition-all" (click)="edit(item)" title="تعديل">
                      <i class="fas fa-edit text-primary"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-light rounded-circle transition-all" (click)="delete(item.id)" title="حذف">
                      <i class="fas fa-trash text-danger"></i>
                    </button>
                  </td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="!loading() && filteredData().length === 0">
                <td colspan="4" class="text-center py-5">
                  <div class="empty-state">
                    <div class="empty-icon-wrapper mx-auto mb-3">
                      <i class="fas fa-briefcase text-muted fa-3x"></i>
                    </div>
                    <h5 class="fw-bold text-dark">{{ ts.t()?.common?.noData || 'لا توجد بيانات' }}</h5>
                    <p class="text-muted">{{ ts.t()?.common?.noDataDesc || 'لم يتم العثور على أي مناصب وظيفية.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  \`,
  styles: [\`
    .page-container {
      padding: 1.5rem 0;
      background-color: transparent;
      font-family: inherit;
    }
    .rtl {
      direction: rtl;
    }
    .rtl .text-end { text-align: left !important; }

    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .premium-card {
      background: var(--bg-surface-solid, #ffffff);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      transition: all 0.3s ease;
    }
    .premium-card:hover {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    }

    .btn-premium {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: white;
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      color: white;
    }

    .glass-input-group {
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .form-card-container {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    .form-card-container.show {
      max-height: 800px;
      opacity: 1;
      margin-bottom: 1.5rem;
      overflow: visible;
    }

    .skeleton-text {
      height: 1rem;
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 0.25rem;
    }
    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon-circle {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      color: #059669;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .rtl .form-floating > label {
      left: auto;
      right: 0;
      transform-origin: top right;
    }
    .rtl .form-floating > .form-control:focus ~ label,
    .rtl .form-floating > .form-control:not(:placeholder-shown) ~ label,
    .rtl .form-floating > .form-select ~ label {
      transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
    }
  \`]
})
export class PositionListComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  svc = inject(PositionService);
  deptSvc = inject(DepartmentService);
  fb = inject(FormBuilder);

  data = signal<any[]>([]);
  departments = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchTerm = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    baseSalary: [0, [Validators.required, Validators.min(1)]],
    departmentId: [null, Validators.required]
  });

  filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.data();
    return this.data().filter(item => 
      item.title?.toLowerCase().includes(term) ||
      item.departmentName?.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.loadData();
    this.loadDepartments();
  }

  loadDepartments() {
    this.deptSvc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.departments.set(items);
      }
    });
  }

  loadData() {
    this.loading.set(true);
    this.svc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.data.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل تحميل بيانات المناصب' : 'Failed to load positions', 'error');
        this.loading.set(false);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleForm() {
    if (this.showForm()) {
      this.closeForm();
    } else {
      this.showForm.set(true);
    }
  }

  closeForm() {
    this.showForm.set(false);
    this.form.reset({ title: '', baseSalary: 0, departmentId: null });
    this.editingId.set(null);
  }

  edit(item: any) {
    this.editingId.set(item.id);
    this.form.patchValue({
      title: item.title,
      baseSalary: item.baseSalary,
      departmentId: item.departmentId
    });
    this.showForm.set(true);
  }

  delete(id: number) {
    const msg = this.ts.isRtl() ? 'هل أنت متأكد من حذف هذا المنصب؟' : 'Are you sure you want to delete this position?';
    if (confirm(msg)) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.toast.show(this.ts.isRtl() ? 'تم حذف المنصب بنجاح' : 'Position deleted successfully', 'success');
          this.loadData();
        },
        error: () => {
          this.toast.show(this.ts.isRtl() ? 'فشل حذف المنصب' : 'Failed to delete position', 'error');
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const id = this.editingId();
    const payload = {
      title: this.form.value.title,
      baseSalary: Number(this.form.value.baseSalary),
      departmentId: Number(this.form.value.departmentId)
    };

    const req = id ? this.svc.update(id, payload) : this.svc.create(payload);

    (req as any).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم حفظ المنصب بنجاح' : 'Position saved successfully', 'success');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || (this.ts.isRtl() ? 'فشل حفظ المنصب' : 'Failed to save position'), 'error');
        this.submitting.set(false);
      }
    });
  }
}
`;

fs.writeFileSync('e:/ITI/APIs/HR/hr-portal/src/app/features/positions/position-list.component.ts', positionListComponent);
console.log('✓ Successfully rewrote position-list.component.ts with department dropdown and salary input');
