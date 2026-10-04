import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceService } from '../../core/services/attendance.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="page-container" [dir]="ts.isRtl() ? 'rtl' : 'ltr'" [class.rtl]="ts.isRtl()">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1"><i class="fas fa-calendar-check text-primary me-2"></i>{{ ts.t().attendance.title }}</h2>
          <p class="text-muted mb-0">{{ ts.t().attendance.subtitle }}</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" (click)="clockIn()" [disabled]="loading()">
            <i class="fas fa-sign-in-alt me-2"></i>{{ ts.t().attendance.clockIn }}
          </button>
          <button class="btn btn-outline-danger" (click)="clockOut()" [disabled]="loading()">
            <i class="fas fa-sign-out-alt me-2"></i>{{ ts.t().attendance.clockOut }}
          </button>
        </div>
      </div>

      <div class="card filter-card mb-4 border-0 shadow-sm glass-card">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label text-muted small fw-medium">{{ ts.t().common.employeeId }}</label>
              <input type="text" class="form-control bg-light border-0" [(ngModel)]="filters.empId" placeholder="Emp ID">
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small fw-medium">{{ ts.t().common.fromDate }}</label>
              <input type="date" class="form-control bg-light border-0" [(ngModel)]="filters.from">
            </div>
            <div class="col-md-3">
              <label class="form-label text-muted small fw-medium">{{ ts.t().common.toDate }}</label>
              <input type="date" class="form-control bg-light border-0" [(ngModel)]="filters.to">
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" (click)="loadData(1)">
                <i class="fas fa-filter me-2"></i>{{ ts.t().common.filter }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm glass-card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="border-0 rounded-start ps-4">{{ ts.t().common.employee }}</th>
                  <th class="border-0">{{ ts.t().common.date }}</th>
                  <th class="border-0">{{ ts.t().attendance.clockInTime }}</th>
                  <th class="border-0">{{ ts.t().attendance.clockOutTime }}</th>
                  <th class="border-0 rounded-end">{{ ts.t().common.status }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
                } @else if (items().length === 0) {
                  <tr><td colspan="5" class="text-center py-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 opacity-50"></i><br>{{ ts.t().common.noData }}</td></tr>
                } @else {
                  @for (item of items(); track item.id) {
                    <tr>
                      <td class="ps-4 fw-medium">{{ item.employeeName || item.employeeId }}</td>
                      <td>{{ item.date | date:'mediumDate' }}</td>
                      <td>
                        @if (item.clockIn) {
                          <span class="text-success"><i class="fas fa-arrow-down me-1"></i>{{ item.clockIn | date:'shortTime' }}</span>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      </td>
                      <td>
                        @if (item.clockOut) {
                          <span class="text-danger"><i class="fas fa-arrow-up me-1"></i>{{ item.clockOut | date:'shortTime' }}</span>
                        } @else {
                          <span class="text-muted">-</span>
                        }
                      </td>
                      <td>
                        <span class="badge rounded-pill" [ngClass]="getStatusClass(item.status)">
                          {{ item.status }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white border-0 py-3">
          <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted small">Total: {{ totalCount() }}</span>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-light" [disabled]="page() === 1" (click)="loadData(page() - 1)">
                <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
              </button>
              <button class="btn btn-sm btn-light" [disabled]="page() * pageSize >= totalCount()" (click)="loadData(page() + 1)">
                <i class="fas" [ngClass]="ts.isRtl() ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
              </button>
            </div>
          </div>
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
  
    .glass-card {
      background: var(--bg-surface-solid, #ffffff);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .table > :not(caption) > * > * {
      padding: 1rem 0.5rem;
      background: transparent;
    }
    .badge-present { background-color: rgba(25, 135, 84, 0.1); color: #198754; }
    .badge-absent { background-color: rgba(220, 53, 69, 0.1); color: #dc3545; }
    .badge-late { background-color: rgba(255, 193, 7, 0.1); color: #ffc107; }
    
    .rtl {
      font-family: 'Cairo', sans-serif;
    }
    .rtl .me-1, .rtl .me-2 {
      margin-left: 0.5rem !important;
      margin-right: 0 !important;
    }
    .rtl .ps-4 {
      padding-right: 1.5rem !important;
      padding-left: 0 !important;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AttendanceComponent {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  attendanceSvc = inject(AttendanceService);
  
  items = signal<any[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = 10;
  loading = signal(false);

  filters = { empId: '', from: '', to: '' };

  constructor() {
    this.loadData();
  }

  loadData(pageIndex: number = 1) {
    this.page.set(pageIndex);
    this.loading.set(true);
    this.attendanceSvc.getAll(this.page(), this.pageSize, Number(this.filters.empId) || undefined, this.filters.from, this.filters.to)
      .subscribe({
        next: (res: any) => {
          this.items.set((res.data?.items || (Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))));
          this.totalCount.set((res.data?.totalCount || res.totalCount) || 0);
          this.loading.set(false);
        },
        error: () => {
          this.toast.show(this.ts.t().common.error || 'Error', 'error');
          this.loading.set(false);
        }
      });
  }

  clockIn() {
    this.loading.set(true);
    this.attendanceSvc.clockIn().subscribe({
      next: () => {
        this.toast.show(this.ts.t().attendance.clockInSuccess || 'Clocked in successfully', 'success');
        this.loadData(1);
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }

  clockOut() {
    this.loading.set(true);
    this.attendanceSvc.clockOut().subscribe({
      next: () => {
        this.toast.show(this.ts.t().attendance.clockOutSuccess || 'Clocked out successfully', 'success');
        this.loadData(1);
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('present')) return 'badge-present';
    if (s.includes('absent')) return 'badge-absent';
    if (s.includes('late')) return 'badge-late';
    return 'bg-secondary';
  }
}
