import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/auth/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-fade-in-up" [class.rtl]="ts.isRtl()">
      <!-- Top Header & Actions -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="page-title fw-bold mb-1 text-dark">{{ ts.isRtl() ? 'طلبات الإجازات' : 'Leave Requests' }}</h2>
          <p class="text-muted mb-0">{{ ts.isRtl() ? 'متابعة وإدارة ومراجعة طلبات إجازات الموظفين' : 'Manage, review, and submit leave requests' }}</p>
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

          <!-- Request Leave Button -->
          <button class="btn btn-primary btn-premium rounded-pill px-4 shadow-sm" (click)="toggleForm()">
            <i class="fas fa-calendar-plus" [class.ms-2]="ts.isRtl()" [class.me-2]="!ts.isRtl()"></i>
            {{ ts.isRtl() ? 'طلب إجازة جديدة' : 'Request Leave' }}
          </button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="toolbar-card card border-0 shadow-sm p-3 mb-4 rounded-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <div class="input-group glass-input-group">
              <span class="input-group-text border-0 bg-transparent text-muted ps-3">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control border-0 bg-transparent py-2" 
                     [placeholder]="ts.isRtl() ? 'بحث بالاسم أو السبب...' : 'Search by name or reason...'"
                     [value]="searchTerm()" (input)="updateSearch($event)">
            </div>
          </div>

          <div class="col-md-4">
            <select class="form-select border-0 bg-surface-select py-2 rounded-3" (change)="onStatusFilter($event)">
              <option value="">{{ ts.isRtl() ? 'جميع الحالات' : 'All Statuses' }}</option>
              <option value="Pending">{{ ts.isRtl() ? 'قيد الانتظار (Pending)' : 'Pending' }}</option>
              <option value="Approved">{{ ts.isRtl() ? 'تمت الموافقة (Approved)' : 'Approved' }}</option>
              <option value="Rejected">{{ ts.isRtl() ? 'مرفوض (Rejected)' : 'Rejected' }}</option>
            </select>
          </div>

          <div class="col-md-4 text-md-end text-muted small">
            <span>{{ ts.isRtl() ? 'إجمالي الطلبات:' : 'Total Requests:' }} <strong class="text-primary">{{ filteredItems().length }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Slide-in Request Form -->
      <div class="form-card-container mb-4" [class.show]="showForm()">
        <div class="card premium-card border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="card-header border-0 bg-gradient-primary text-white p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold mb-1">{{ ts.isRtl() ? 'تقديم طلب إجازة' : 'Submit Leave Request' }}</h5>
                <p class="small text-white-50 mb-0">{{ ts.isRtl() ? 'يرجى تحديد نوع وتواريخ الإجازة مع إيضاح السبب' : 'Specify leave type, dates, and reason for review' }}</p>
              </div>
              <button class="btn btn-sm btn-light btn-close-white rounded-circle" (click)="closeForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="card-body p-4">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="form-floating">
                    <select class="form-select rounded-3" id="leaveType" formControlName="leaveType">
                      <option value="Annual">{{ ts.isRtl() ? 'سنوية (Annual)' : 'Annual' }}</option>
                      <option value="Sick">{{ ts.isRtl() ? 'مرضية (Sick)' : 'Sick' }}</option>
                      <option value="Casual">{{ ts.isRtl() ? 'عارضة (Casual)' : 'Casual' }}</option>
                      <option value="Maternity">{{ ts.isRtl() ? 'أمومة (Maternity)' : 'Maternity' }}</option>
                      <option value="Unpaid">{{ ts.isRtl() ? 'بدون راتب (Unpaid)' : 'Unpaid' }}</option>
                    </select>
                    <label for="leaveType">{{ ts.isRtl() ? 'نوع الإجازة' : 'Leave Type' }} *</label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input type="date" class="form-control rounded-3" id="startDate" formControlName="startDate" placeholder="تاريخ البدء">
                    <label for="startDate">{{ ts.isRtl() ? 'تاريخ البدء' : 'Start Date' }} *</label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input type="date" class="form-control rounded-3" id="endDate" formControlName="endDate" placeholder="تاريخ الانتهاء">
                    <label for="endDate">{{ ts.isRtl() ? 'تاريخ الانتهاء' : 'End Date' }} *</label>
                  </div>
                </div>

                <div class="col-12">
                  <div class="form-floating">
                    <textarea class="form-control rounded-3" id="reason" formControlName="reason" style="height: 100px" placeholder="سبب الإجازة"></textarea>
                    <label for="reason">{{ ts.isRtl() ? 'سبب الإجازة والملاحظات' : 'Reason / Notes' }}</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4 gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" (click)="closeForm()">
                  {{ ts.isRtl() ? 'إلغاء' : 'Cancel' }}
                </button>
                <button type="submit" class="btn btn-primary btn-premium rounded-pill px-5" [disabled]="form.invalid || submitting()">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="submitting()"></i>
                  {{ ts.isRtl() ? 'إرسال الطلب' : 'Submit Request' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- VIEW 1: Modern Cards Grid -->
      @if (viewMode() === 'cards') {
        <div class="row g-4 mb-4">
          @if (loading()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="leave-card-modern p-4 rounded-4 shadow-sm">
                  <div class="skeleton-text w-50 mb-3"></div>
                  <div class="skeleton-text w-100 mb-2"></div>
                  <div class="skeleton-text w-75"></div>
                </div>
              </div>
            }
          }

          @if (!loading() && filteredItems().length > 0) {
            @for (item of filteredItems(); track item.id) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="leave-card-modern p-4 rounded-4 shadow-sm position-relative" (click)="viewLeaveDetails(item)">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 class="fw-bold mb-1 text-card-title">{{ item.employeeName || 'موظف' }}</h5>
                      <span class="small text-muted">{{ item.departmentName || '-' }}</span>
                    </div>

                    <span class="badge px-3 py-2 rounded-pill shadow-sm" [ngClass]="getStatusBadgeClass(item.status)">
                      {{ getStatusArabic(item.status) }}
                    </span>
                  </div>

                  <div class="leave-details-box p-3 rounded-3 bg-surface border mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted small"><i class="fas fa-tag me-1 text-primary"></i> نوع الإجازة:</span>
                      <strong class="text-primary">{{ item.leaveType }}</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted small"><i class="fas fa-calendar-alt me-1 text-info"></i> الفترة:</span>
                      <span class="small font-monospace">{{ item.startDate | date:'shortDate' }} - {{ item.endDate | date:'shortDate' }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted small"><i class="fas fa-clock me-1 text-warning"></i> عدد الأيام:</span>
                      <span class="badge bg-secondary bg-opacity-10 text-dark rounded-pill">{{ item.totalDays || 1 }} يوم</span>
                    </div>
                  </div>

                  <div class="pt-2 border-top d-flex justify-content-between align-items-center text-muted small">
                    <span class="text-truncate" style="max-width: 180px;">{{ item.reason || 'لا يوجد سبب محدد' }}</span>
                    <span class="text-primary fw-bold click-hint">
                      {{ ts.isRtl() ? 'تفاصيل' : 'Details' }} <i class="fas" [class.fa-arrow-left]="ts.isRtl()" [class.fa-arrow-right]="!ts.isRtl()"></i>
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
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'الموظف' : 'Employee' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'النوع' : 'Type' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'تاريخ البدء' : 'Start Date' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'تاريخ الانتهاء' : 'End Date' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'الأيام' : 'Days' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'الحالة' : 'Status' }}</th>
                  <th class="py-3 px-4 text-end">{{ ts.isRtl() ? 'الإجراءات' : 'Actions' }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (i of [1,2,3]; track i) {
                    <tr>
                      <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3 text-end"><div class="skeleton-text w-50 d-inline-block"></div></td>
                    </tr>
                  }
                }

                @if (!loading() && filteredItems().length > 0) {
                  @for (item of filteredItems(); track item.id) {
                    <tr class="modern-row" (click)="viewLeaveDetails(item)">
                      <td class="px-4 py-3 fw-bold text-card-title hover-underline">
                        {{ item.employeeName || 'موظف' }}
                      </td>
                      <td class="px-4 py-3">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                          {{ item.leaveType }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-muted">{{ item.startDate | date:'mediumDate' }}</td>
                      <td class="px-4 py-3 text-muted">{{ item.endDate | date:'mediumDate' }}</td>
                      <td class="px-4 py-3 fw-bold">{{ item.totalDays || 1 }}</td>
                      <td class="px-4 py-3">
                        <span class="badge px-3 py-2 rounded-pill" [ngClass]="getStatusBadgeClass(item.status)">
                          {{ getStatusArabic(item.status) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-end" (click)="$event.stopPropagation()">
                        @if (item.status === 'Pending' && authService.isHR()) {
                          <button class="btn btn-sm btn-success rounded-pill px-3 me-1" (click)="approve(item.id)">
                            <i class="fas fa-check me-1"></i> {{ ts.isRtl() ? 'قبول' : 'Approve' }}
                          </button>
                          <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="reject(item.id)">
                            <i class="fas fa-times me-1"></i> {{ ts.isRtl() ? 'رفض' : 'Reject' }}
                          </button>
                        } @else {
                          <span class="text-muted small">-</span>
                        }
                      </td>
                    </tr>
                  }
                }

                @if (!loading() && filteredItems().length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-5">
                      <div class="empty-state py-4">
                        <div class="empty-icon-wrapper mx-auto mb-3">
                          <i class="fas fa-calendar-times text-muted fa-3x"></i>
                        </div>
                        <h5 class="fw-bold">{{ ts.isRtl() ? 'لا توجد طلبات إجازة تطابق البحث' : 'No Leave Requests Found' }}</h5>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- LEAVE DETAILS POPUP MODAL -->
      @if (selectedLeave()) {
        <div class="modal-backdrop-custom" (click)="closeLeaveDetails()">
          <div class="employee-detail-modal shadow-2xl rounded-4 overflow-hidden" (click)="$event.stopPropagation()">
            <div class="modal-profile-banner p-4 text-white position-relative" [style.background]="getLeaveGradient(selectedLeave().status)">
              <button class="btn-close-modal rounded-circle" (click)="closeLeaveDetails()">
                <i class="fas fa-times"></i>
              </button>
              <div class="d-flex align-items-center gap-3 mt-2">
                <div class="large-avatar-circle shadow-lg">
                  <i class="fas fa-plane-departure fa-lg"></i>
                </div>
                <div>
                  <h3 class="fw-bold mb-1">{{ selectedLeave().employeeName || 'طلب إجازة' }}</h3>
                  <span class="badge bg-white text-dark rounded-pill px-3 py-1 shadow-sm">
                    {{ selectedLeave().leaveType }} • {{ selectedLeave().totalDays || 1 }} يوم
                  </span>
                </div>
              </div>
            </div>

            <div class="modal-profile-body p-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3 small">
                {{ ts.isRtl() ? 'تفاصيل الطلب' : 'Request Information' }}
              </h6>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <small class="text-muted d-block">{{ ts.isRtl() ? 'تاريخ البدء' : 'Start Date' }}</small>
                    <span class="fw-bold fs-6">{{ selectedLeave().startDate | date:'fullDate' }}</span>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <small class="text-muted d-block">{{ ts.isRtl() ? 'تاريخ الانتهاء' : 'End Date' }}</small>
                    <span class="fw-bold fs-6">{{ selectedLeave().endDate | date:'fullDate' }}</span>
                  </div>
                </div>

                <div class="col-12">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <small class="text-muted d-block">{{ ts.isRtl() ? 'السبب والملاحظات' : 'Reason / Notes' }}</small>
                    <p class="mb-0 fw-medium text-dark mt-1">{{ selectedLeave().reason || 'لا توجد ملاحظات مرفقة.' }}</p>
                  </div>
                </div>

                <div class="col-12">
                  <div class="info-box p-3 rounded-3 bg-surface border d-flex justify-content-between align-items-center">
                    <div>
                      <small class="text-muted d-block">{{ ts.isRtl() ? 'الحالة الحالية' : 'Current Status' }}</small>
                      <strong class="fs-5">{{ getStatusArabic(selectedLeave().status) }}</strong>
                    </div>
                    <span class="badge px-4 py-2 rounded-pill fs-6" [ngClass]="getStatusBadgeClass(selectedLeave().status)">
                      {{ selectedLeave().status }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- HR Actions -->
              @if (selectedLeave().status === 'Pending' && authService.isHR()) {
                <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                  <button class="btn btn-danger rounded-pill px-4" (click)="reject(selectedLeave().id); closeLeaveDetails()">
                    <i class="fas fa-times me-1"></i> {{ ts.isRtl() ? 'رفض الطلب' : 'Reject' }}
                  </button>
                  <button class="btn btn-success rounded-pill px-5" (click)="approve(selectedLeave().id); closeLeaveDetails()">
                    <i class="fas fa-check me-1"></i> {{ ts.isRtl() ? 'موافقة وقبول' : 'Approve' }}
                  </button>
                </div>
              }
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

    .toolbar-card, .leave-card-modern, .modern-table-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }

    .leave-card-modern {
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .leave-card-modern:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px -6px rgba(0, 0, 0, 0.15) !important;
      border-color: #3b82f6 !important;
    }

    .glass-input-group, .bg-surface-select {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0) !important;
      color: var(--text-primary);
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
      width: 100%; max-width: 620px; background: var(--bg-surface-solid, #ffffff);
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

    .badge-pending { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-approved { background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-rejected { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
  `]
})
export class LeaveListComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  leaveSvc = inject(LeaveService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  items = signal<any[]>([]);
  loading = signal(false);
  submitting = signal(false);
  showForm = signal(false);
  searchTerm = signal('');
  statusFilter = signal('');

  viewMode = signal<'cards' | 'table'>('table');
  selectedLeave = signal<any | null>(null);

  form: FormGroup = this.fb.group({
    leaveType: ['Annual', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['']
  });

  filteredItems = computed(() => {
    let list = this.items();
    const status = this.statusFilter();
    if (status) {
      list = list.filter(item => item.status === status);
    }
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(item => 
        item.employeeName?.toLowerCase().includes(term) ||
        item.leaveType?.toLowerCase().includes(term) ||
        item.reason?.toLowerCase().includes(term)
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const empId = this.authService.isHR() ? undefined : this.authService.getEmployeeId();
    
    const req = (empId && !this.authService.isHR())
      ? this.leaveSvc.getByEmployee(empId)
      : this.leaveSvc.getAll();

    (req as any).subscribe({
      next: (res: any) => {
        const raw = res.data?.items || (Array.isArray(res.data) ? res.data : (res.items || []));
        this.items.set(raw);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل تحميل طلبات الإجازات' : 'Failed to load leave requests', 'error');
        this.loading.set(false);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  viewLeaveDetails(item: any) {
    this.selectedLeave.set(item);
  }

  closeLeaveDetails() {
    this.selectedLeave.set(null);
  }

  toggleForm() {
    this.showForm.update(v => !v);
  }

  closeForm() {
    this.showForm.set(false);
    this.form.reset({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  getStatusArabic(status: string): string {
    switch (status) {
      case 'Approved': return this.ts.isRtl() ? 'تمت الموافقة' : 'Approved';
      case 'Rejected': return this.ts.isRtl() ? 'مرفوض' : 'Rejected';
      default: return this.ts.isRtl() ? 'قيد المراجعة' : 'Pending';
    }
  }

  getLeaveGradient(status: string): string {
    switch (status) {
      case 'Approved': return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
      case 'Rejected': return 'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)';
      default: return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
    }
  }

  approve(id: number) {
    this.leaveSvc.approve(id).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تمت الموافقة على طلب الإجازة' : 'Leave request approved', 'success');
        this.loadData();
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل قبول الطلب' : 'Failed to approve request', 'error');
      }
    });
  }

  reject(id: number) {
    const note = prompt(this.ts.isRtl() ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):');
    this.leaveSvc.reject(id, note || undefined).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم رفض طلب الإجازة' : 'Leave request rejected', 'warning');
        this.loadData();
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل رفض الطلب' : 'Failed to reject request', 'error');
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const payload = {
      ...this.form.value
    };

    this.leaveSvc.submit(payload).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم تقديم طلب الإجازة بنجاح' : 'Leave request submitted successfully', 'success');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || (this.ts.isRtl() ? 'فشل تقديم طلب الإجازة' : 'Failed to submit request'), 'error');
        this.submitting.set(false);
      }
    });
  }
}
