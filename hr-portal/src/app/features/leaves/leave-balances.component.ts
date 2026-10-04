import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { LeaveService } from '../../core/services/leave.service';

@Component({
  selector: 'app-leave-balances',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container" [dir]="ts.isRtl() ? 'rtl' : 'ltr'" [class.rtl]="ts.isRtl()">
      <div class="page-header mb-4">
        <h2 class="fw-bold mb-1"><i class="fas fa-scale-balanced text-primary me-2"></i>{{ ts.t().leaveBalances.title }}</h2>
        <p class="text-muted mb-0">{{ ts.t().leaveBalances.subtitle }}</p>
      </div>

      <div class="card border-0 shadow-sm glass-card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="border-0 rounded-start ps-4">{{ ts.t().common.employee }}</th>
                  <th class="border-0 text-center"><i class="fas fa-umbrella-beach me-2 text-primary"></i>Annual</th>
                  <th class="border-0 text-center"><i class="fas fa-notes-medical me-2 text-danger"></i>Sick</th>
                  <th class="border-0 text-center"><i class="fas fa-user me-2 text-warning"></i>Personal</th>
                  <th class="border-0 text-center rounded-end"><i class="fas fa-baby me-2 text-info"></i>Maternity</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
                } @else if (items().length === 0) {
                  <tr><td colspan="5" class="text-center py-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 opacity-50"></i><br>{{ ts.t().common.noData }}</td></tr>
                } @else {
                  @for (item of items(); track item.employeeId) {
                    <tr>
                      <td class="ps-4 fw-medium">{{ item.employeeName || item.employeeId }}</td>
                      <td class="text-center">
                        <div class="balance-pill bg-primary-subtle text-primary">{{ item.annual || 0 }}</div>
                      </td>
                      <td class="text-center">
                        <div class="balance-pill bg-danger-subtle text-danger">{{ item.sick || 0 }}</div>
                      </td>
                      <td class="text-center">
                        <div class="balance-pill bg-warning-subtle text-warning">{{ item.personal || 0 }}</div>
                      </td>
                      <td class="text-center">
                        <div class="balance-pill bg-info-subtle text-info">{{ item.maternity || 0 }}</div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
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
  
    .glass-card { background: var(--bg-surface-solid, #ffffff); backdrop-filter: blur(10px); border-radius: 16px; }
    .table > :not(caption) > * > * { padding: 1rem 0.5rem; background: transparent; }
    
    .balance-pill { 
      display: inline-block; 
      min-width: 40px; 
      padding: 0.25rem 0.75rem; 
      border-radius: 20px; 
      font-weight: 600; 
      font-size: 0.9rem;
    }
    
    .bg-primary-subtle { background-color: rgba(13, 110, 253, 0.1); }
    .bg-danger-subtle { background-color: rgba(220, 53, 69, 0.1); }
    .bg-warning-subtle { background-color: rgba(255, 193, 7, 0.1); }
    .bg-info-subtle { background-color: rgba(13, 202, 240, 0.1); }
    
    .rtl { font-family: 'Cairo', sans-serif; }
    .rtl .me-1, .rtl .me-2 { margin-left: 0.5rem !important; margin-right: 0 !important; }
    .rtl .ps-4 { padding-right: 1.5rem !important; padding-left: 0 !important; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LeaveBalancesComponent {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  leaveSvc = inject(LeaveService);
  
  items = signal<any[]>([]);
  loading = signal(false);

  constructor() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.leaveSvc.getBalances(1).subscribe({
      next: (res: any) => {
        this.items.set((Array.isArray(res.data) ? res.data : (res.data?.items || [])));
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }
}
