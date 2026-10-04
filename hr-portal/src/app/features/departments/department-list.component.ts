import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-fade-in-up" [class.rtl]="ts.isRtl()">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="page-title fw-bold mb-1 text-dark">{{ ts.isRtl() ? 'أقسام الشركة' : 'Departments' }}</h2>
          <p class="text-muted mb-0">{{ ts.isRtl() ? 'إدارة الهيكل التنظيمي وأقسام العمل وفروعها' : 'Manage organizational structure and company departments' }}</p>
        </div>

        <div class="d-flex align-items-center gap-3">
          <!-- View Switcher -->
          <div class="view-mode-toggle btn-group p-1 rounded-pill bg-surface border">
            <button class="btn btn-sm rounded-pill px-3" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
              <i class="fas fa-list me-1"></i> {{ ts.isRtl() ? 'جدول' : 'Table' }}
            </button>
            <button class="btn btn-sm rounded-pill px-3" [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')">
              <i class="fas fa-th-large me-1"></i> {{ ts.isRtl() ? 'كروت' : 'Cards' }}
            </button>
          </div>

          <!-- Add Button -->
          <button class="btn btn-primary btn-premium rounded-pill px-4 shadow-sm" (click)="toggleForm()">
            <i class="fas fa-plus" [class.ms-2]="ts.isRtl()" [class.me-2]="!ts.isRtl()"></i>
            {{ ts.isRtl() ? 'إضافة قسم جديد' : 'Add Department' }}
          </button>
        </div>
      </div>

      <!-- Search & Stats Toolbar -->
      <div class="toolbar-card card border-0 shadow-sm p-3 mb-4 rounded-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <div class="input-group glass-input-group">
              <span class="input-group-text border-0 bg-transparent text-muted ps-3">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control border-0 bg-transparent py-2" 
                     [placeholder]="ts.isRtl() ? 'بحث عن قسم بالاسم...' : 'Search departments by name...'"
                     [value]="searchTerm()" (input)="updateSearch($event)">
            </div>
          </div>
          <div class="col-md-6 text-md-end text-muted small">
            <span>{{ ts.isRtl() ? 'إجمالي الأقسام:' : 'Total Departments:' }} <strong class="text-primary">{{ filteredData().length }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Slide-in Add/Edit Form -->
      <div class="form-card-container mb-4" [class.show]="showForm()">
        <div class="card premium-card border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="card-header border-0 bg-gradient-primary text-white p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold mb-1">
                  {{ editingId() ? (ts.isRtl() ? 'تعديل بيانات القسم' : 'Edit Department') : (ts.isRtl() ? 'إنشاء قسم جديد' : 'New Department') }}
                </h5>
                <p class="small text-white-50 mb-0">{{ ts.isRtl() ? 'أدخل اسم القسم ليتم إدراجه في الهيكل التنظيمي' : 'Enter the department title to include in company hierarchy' }}</p>
              </div>
              <button class="btn btn-sm btn-light btn-close-white rounded-circle" (click)="closeForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="card-body p-4">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="row g-3">
                <div class="col-md-12">
                  <div class="form-floating">
                    <input type="text" class="form-control rounded-3" id="deptName" formControlName="name" placeholder="اسم القسم">
                    <label for="deptName">{{ ts.isRtl() ? 'اسم القسم' : 'Department Name' }} *</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4 gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" (click)="closeForm()">
                  {{ ts.isRtl() ? 'إلغاء' : 'Cancel' }}
                </button>
                <button type="submit" class="btn btn-primary btn-premium rounded-pill px-5" [disabled]="form.invalid || submitting()">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="submitting()"></i>
                  {{ ts.isRtl() ? 'حفظ القسم' : 'Save Department' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- VIEW 1: Cards Grid -->
      @if (viewMode() === 'cards') {
        <div class="row g-4 mb-4">
          @if (loading()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="col-12 col-md-6 col-xl-3">
                <div class="dept-card-modern p-4 rounded-4 shadow-sm">
                  <div class="skeleton-circle mb-3"></div>
                  <div class="skeleton-text w-75 mb-2"></div>
                  <div class="skeleton-text w-50"></div>
                </div>
              </div>
            }
          }

          @if (!loading() && filteredData().length > 0) {
            @for (item of filteredData(); track item.id) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="dept-card-modern p-4 rounded-4 shadow-sm position-relative" (click)="viewDepartmentDetails(item)">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex gap-3 align-items-center">
                      <div class="dept-icon-box" [style.background]="getDeptGradient(item.id)">
                        <i class="fas fa-sitemap"></i>
                      </div>
                      <div>
                        <h5 class="fw-bold mb-1 text-card-title">{{ item.name }}</h5>
                        <span class="small text-muted">ID: #DEPT-{{ item.id }}</span>
                      </div>
                    </div>

                    <div class="dropdown" (click)="$event.stopPropagation()">
                      <button class="btn btn-sm btn-icon btn-light rounded-circle" (click)="edit(item)" title="تعديل">
                        <i class="fas fa-pen text-primary"></i>
                      </button>
                      <button class="btn btn-sm btn-icon btn-light rounded-circle ms-1" (click)="delete(item.id)" title="حذف">
                        <i class="fas fa-trash text-danger"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Metrics -->
                  <div class="row g-2 text-center mt-3 pt-3 border-top">
                    <div class="col-6 border-end">
                      <div class="fs-4 fw-bold text-primary">{{ item.employeeCount || 0 }}</div>
                      <small class="text-muted">{{ ts.isRtl() ? 'موظف' : 'Employees' }}</small>
                    </div>
                    <div class="col-6">
                      <div class="fs-4 fw-bold text-info">{{ item.positionCount || 0 }}</div>
                      <small class="text-muted">{{ ts.isRtl() ? 'منصب وظيفي' : 'Positions' }}</small>
                    </div>
                  </div>

                  <div class="pt-3 mt-3 border-top d-flex justify-content-between align-items-center text-muted small">
                    <span class="text-primary fw-bold click-hint">
                      {{ ts.isRtl() ? 'عرض التفاصيل والهيكل' : 'View Structure' }} <i class="fas" [class.fa-arrow-left]="ts.isRtl()" [class.fa-arrow-right]="!ts.isRtl()"></i>
                    </span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- VIEW 2: Modern Table -->
      @if (viewMode() === 'table') {
        <div class="card modern-table-card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div class="table-responsive">
            <table class="table modern-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'اسم القسم' : 'Department Name' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'عدد الموظفين' : 'Employees' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'المناصب الوظيفية' : 'Positions' }}</th>
                  <th class="py-3 px-4 text-end">{{ ts.isRtl() ? 'الإجراءات' : 'Actions' }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3]; track i) {
                    <tr>
                      <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                      <td class="px-4 py-3 text-end"><div class="skeleton-text w-50 d-inline-block"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && filteredData().length > 0) {
                  @for (item of filteredData(); track item.id) {
                    <tr class="modern-row" (click)="viewDepartmentDetails(item)">
                      <td class="px-4 py-3">
                        <div class="d-flex align-items-center">
                          <div class="dept-icon-box sm me-3" [class.ms-3]="ts.isRtl()" [class.me-3]="!ts.isRtl()" [style.background]="getDeptGradient(item.id)">
                            <i class="fas fa-sitemap"></i>
                          </div>
                          <div>
                            <div class="fw-bold text-card-title hover-underline">{{ item.name }}</div>
                            <small class="text-muted">ID: #DEPT-{{ item.id }}</small>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                          <i class="fas fa-users me-1"></i> {{ item.employeeCount || 0 }} {{ ts.isRtl() ? 'موظف' : 'Employees' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                          <i class="fas fa-briefcase me-1"></i> {{ item.positionCount || 0 }} {{ ts.isRtl() ? 'منصب' : 'Positions' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-end" (click)="$event.stopPropagation()">
                        <button class="btn btn-sm btn-icon btn-light me-1 rounded-circle shadow-sm" (click)="edit(item)" title="تعديل">
                          <i class="fas fa-pen text-primary"></i>
                        </button>
                        <button class="btn btn-sm btn-icon btn-light rounded-circle shadow-sm" (click)="delete(item.id)" title="حذف">
                          <i class="fas fa-trash text-danger"></i>
                        </button>
                      </td>
                    </tr>
                  }
                }

                @if (!loading() && filteredData().length === 0) {
                  <tr>
                    <td colspan="4" class="text-center py-5">
                      <div class="empty-state py-4">
                        <div class="empty-icon-wrapper mx-auto mb-3">
                          <i class="fas fa-sitemap text-muted fa-3x"></i>
                        </div>
                        <h5 class="fw-bold">{{ ts.isRtl() ? 'لم يتم العثور على أي أقسام' : 'No Departments Found' }}</h5>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- DEPARTMENT DETAILS POPUP MODAL -->
      @if (selectedDept()) {
        <div class="modal-backdrop-custom" (click)="closeDepartmentDetails()">
          <div class="employee-detail-modal shadow-2xl rounded-4 overflow-hidden" (click)="$event.stopPropagation()">
            <div class="modal-profile-banner p-4 text-white position-relative" [style.background]="getDeptGradient(selectedDept().id)">
              <button class="btn-close-modal rounded-circle" (click)="closeDepartmentDetails()">
                <i class="fas fa-times"></i>
              </button>
              <div class="d-flex align-items-center gap-3 mt-2">
                <div class="large-avatar-circle shadow-lg">
                  <i class="fas fa-building fa-lg"></i>
                </div>
                <div>
                  <h3 class="fw-bold mb-1">{{ selectedDept().name }}</h3>
                  <span class="badge bg-white text-dark rounded-pill px-3 py-1">
                    كود القسم: #DEPT-{{ selectedDept().id }}
                  </span>
                </div>
              </div>
            </div>

            <div class="modal-profile-body p-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3 small">
                {{ ts.isRtl() ? 'إحصائيات وهيكل القسم' : 'Department Statistics' }}
              </h6>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-primary bg-primary bg-opacity-10 rounded-circle">
                        <i class="fas fa-users"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'إجمالي الموظفين' : 'Employee Count' }}</small>
                        <span class="fs-4 fw-bold text-primary">{{ selectedDept().employeeCount || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-info bg-info bg-opacity-10 rounded-circle">
                        <i class="fas fa-briefcase"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'المناصب التابعة للقسم' : 'Position Count' }}</small>
                        <span class="fs-4 fw-bold text-info">{{ selectedDept().positionCount || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button class="btn btn-outline-danger rounded-pill px-4" (click)="delete(selectedDept().id); closeDepartmentDetails()">
                  <i class="fas fa-trash me-1"></i> {{ ts.isRtl() ? 'حذف القسم' : 'Delete' }}
                </button>
                <button class="btn btn-primary btn-premium rounded-pill px-4" (click)="edit(selectedDept()); closeDepartmentDetails()">
                  <i class="fas fa-pen me-1"></i> {{ ts.isRtl() ? 'تعديل الاسم' : 'Edit' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem 0; background-color: transparent; font-family: inherit; }
    .rtl { direction: rtl; }
    .rtl .text-end { text-align: left !important; }

    .btn-premium {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      border: none;
      transition: all 0.25s ease;
      color: white;
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.5);
      color: white;
    }

    .view-mode-toggle { background: var(--bg-surface-solid, #ffffff); }
    .view-mode-toggle .btn { border: none; color: var(--text-secondary, #64748b); font-weight: 500; }
    .view-mode-toggle .btn.active { background: #3b82f6; color: #ffffff; }

    .toolbar-card, .dept-card-modern, .modern-table-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }

    .dept-card-modern {
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dept-card-modern:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px -6px rgba(0, 0, 0, 0.15) !important;
      border-color: #3b82f6 !important;
    }

    .dept-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      color: white;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    .dept-icon-box.sm { width: 40px; height: 40px; font-size: 1rem; }

    .glass-input-group {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .modern-table thead th {
      border-bottom: 2px solid var(--border-color, #e2e8f0);
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-secondary, #64748b);
      background: transparent;
    }
    .modern-row { cursor: pointer; transition: all 0.2s ease; }
    .modern-row:hover { background-color: rgba(59, 130, 246, 0.04) !important; }
    .modern-row:hover .hover-underline { color: #3b82f6 !important; }

    .form-card-container {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    .form-card-container.show { max-height: 800px; opacity: 1; overflow: visible; }

    .modal-backdrop-custom {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .employee-detail-modal {
      width: 100%; max-width: 600px; background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    }
    .btn-close-modal {
      position: absolute; top: 1rem; inset-inline-end: 1rem; width: 36px; height: 36px;
      background: rgba(0, 0, 0, 0.25); border: none; color: white; display: flex; align-items: center; justify-content: center;
    }
    .large-avatar-circle {
      width: 64px; height: 64px; border-radius: 18px; background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px); color: white; display: flex; align-items: center; justify-content: center;
    }
    .info-icon { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }
  `]
})
export class DepartmentListComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  svc = inject(DepartmentService);
  fb = inject(FormBuilder);

  data = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  searchTerm = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);

  viewMode = signal<'cards' | 'table'>('cards');
  selectedDept = signal<any | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required]
  });

  filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.data();
    return this.data().filter(item => 
      item.name?.toLowerCase().includes(term) 
    );
  });

  deptGradients = [
    'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  ];

  getDeptGradient(id: number): string {
    return this.deptGradients[(id || 0) % this.deptGradients.length];
  }

  ngOnInit() {
    this.loadData();
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
        this.toast.show(this.ts.isRtl() ? 'فشل تحميل بيانات الأقسام' : 'Failed to load departments', 'error');
        this.loading.set(false);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  viewDepartmentDetails(item: any) {
    this.selectedDept.set(item);
  }

  closeDepartmentDetails() {
    this.selectedDept.set(null);
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
    this.form.patchValue({ name: item.name });
    this.showForm.set(true);
  }

  delete(id: number) {
    const msg = this.ts.isRtl() ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this department?';
    if (confirm(msg)) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.toast.show(this.ts.isRtl() ? 'تم حذف القسم بنجاح' : 'Department deleted successfully', 'success');
          this.loadData();
        },
        error: () => {
          this.toast.show(this.ts.isRtl() ? 'فشل حذف القسم' : 'Failed to delete department', 'error');
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const id = this.editingId();
    const payload = { name: this.form.value.name };

    const req = id ? this.svc.update(id, payload) : this.svc.create(payload);

    (req as any).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم حفظ القسم بنجاح' : 'Department saved successfully', 'success');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل حفظ القسم' : 'Failed to save department', 'error');
        this.submitting.set(false);
      }
    });
  }
}
