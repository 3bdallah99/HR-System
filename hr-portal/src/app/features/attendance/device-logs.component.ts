import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceService } from '../../core/services/attendance.service';

@Component({
  selector: 'app-device-logs',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="page-container" [dir]="ts.isRtl() ? 'rtl' : 'ltr'" [class.rtl]="ts.isRtl()">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1"><i class="fas fa-fingerprint text-primary me-2"></i>{{ ts.t().deviceLogs.title }}</h2>
          <p class="text-muted mb-0">{{ ts.t().deviceLogs.subtitle }}</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" (click)="toggleUpload()">
            <i class="fas fa-upload me-2"></i>{{ ts.t().deviceLogs.upload }}
          </button>
          <button class="btn btn-primary" (click)="processPunches()" [disabled]="loading()">
            <i class="fas fa-cogs me-2"></i>{{ ts.t().deviceLogs.process }}
          </button>
        </div>
      </div>

      @if (showUpload()) {
        <div class="card border-0 shadow-sm glass-card mb-4 upload-card">
          <div class="card-body p-4 text-center">
            <div class="upload-area p-5 border border-dashed rounded-3 bg-light" (click)="fileInput.click()">
              <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
              <h5>{{ ts.t().deviceLogs.dragDrop }}</h5>
              <p class="text-muted small">{{ ts.t().deviceLogs.supportedFormats }}</p>
              <input type="file" #fileInput class="d-none" (change)="onFileSelected($event)">
              @if (selectedFile()) {
                <div class="mt-3 text-success fw-medium">
                  <i class="fas fa-check-circle me-1"></i> {{ selectedFile()?.name }}
                </div>
                <button class="btn btn-sm btn-primary mt-3" (click)="$event.stopPropagation(); uploadFile()">
                  {{ ts.t().common.submit }}
                </button>
              }
            </div>
          </div>
        </div>
      }

      <div class="card border-0 shadow-sm glass-card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="border-0 rounded-start ps-4">ID</th>
                  <th class="border-0">{{ ts.t().deviceLogs.deviceEmpId }}</th>
                  <th class="border-0">{{ ts.t().deviceLogs.punchTime }}</th>
                  <th class="border-0 rounded-end">{{ ts.t().common.status }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr><td colspan="4" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></td></tr>
                } @else if (items().length === 0) {
                  <tr><td colspan="4" class="text-center py-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 opacity-50"></i><br>{{ ts.t().common.noData }}</td></tr>
                } @else {
                  @for (item of items(); track item.id) {
                    <tr>
                      <td class="ps-4 text-muted">#{{ item.id }}</td>
                      <td class="fw-medium">{{ item.deviceEmployeeId }}</td>
                      <td>{{ item.punchTime | date:'medium' }}</td>
                      <td>
                        @if (item.processed) {
                          <span class="badge badge-success rounded-pill"><i class="fas fa-check me-1"></i>{{ ts.t().common.yes }}</span>
                        } @else {
                          <span class="badge badge-secondary rounded-pill">{{ ts.t().common.no }}</span>
                        }
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
    .border-dashed { border-style: dashed !important; border-width: 2px !important; border-color: #dee2e6; cursor: pointer; transition: all 0.3s; }
    .border-dashed:hover { border-color: #0d6efd; background-color: rgba(13, 110, 253, 0.05) !important; }
    .badge-success { background-color: rgba(25, 135, 84, 0.1); color: #198754; }
    .badge-secondary { background-color: rgba(108, 117, 125, 0.1); color: #6c757d; }
    .upload-card { animation: slideDown 0.3s ease-out; }
    
    .rtl { font-family: 'Cairo', sans-serif; }
    .rtl .me-1, .rtl .me-2 { margin-left: 0.5rem !important; margin-right: 0 !important; }
    .rtl .ps-4 { padding-right: 1.5rem !important; padding-left: 0 !important; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DeviceLogsComponent {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  attendanceSvc = inject(AttendanceService);
  
  items = signal<any[]>([]);
  loading = signal(false);
  showUpload = signal(false);
  selectedFile = signal<File | null>(null);

  constructor() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.attendanceSvc.getDeviceLogs().subscribe({
      next: (res: any) => {
        this.items.set(res.data || (res.data?.items || (Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))));
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }

  toggleUpload() {
    this.showUpload.update(v => !v);
    this.selectedFile.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;
    
    this.loading.set(true);
    this.attendanceSvc.uploadDeviceLog(file).subscribe({
      next: () => {
        this.toast.show(this.ts.t().common.success || 'Uploaded successfully', 'success');
        this.showUpload.set(false);
        this.selectedFile.set(null);
        this.loadData();
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }

  processPunches() {
    this.loading.set(true);
    this.attendanceSvc.processDevicePunches().subscribe({
      next: () => {
        this.toast.show(this.ts.t().common.success || 'Processed successfully', 'success');
        this.loadData();
      },
      error: () => {
        this.toast.show(this.ts.t().common.error || 'Error', 'error');
        this.loading.set(false);
      }
    });
  }
}
