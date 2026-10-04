import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="toast-container position-fixed top-0 p-3" 
      [ngClass]="ts.isRtl() ? 'start-0' : 'end-0'" 
      style="z-index: 9999;">
      
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast show border-0 shadow-lg mb-3 overflow-hidden"
        [ngClass]="getToastClass(toast.type)"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">
        
        <div class="toast-content d-flex p-3 text-white">
          <div class="toast-icon me-3 ms-1 d-flex align-items-center">
            <i class="fs-4" [ngClass]="getIconClass(toast.type)"></i>
          </div>
          
          <div class="toast-body p-0 flex-grow-1">
            <strong *ngIf="toast.title" class="d-block mb-1">{{ toast.title }}</strong>
            <span class="d-block">{{ toast.message }}</span>
          </div>
          
          <button
            type="button"
            class="btn-close btn-close-white ms-2 m-auto"
            (click)="removeToast(toast.id)"
            [attr.aria-label]="ts.t().common?.close || 'Close'"></button>
        </div>

        <div class="toast-progress">
          <div class="toast-progress-bar" 
            [ngClass]="getProgressClass(toast.type)"
            [style.animation-duration.ms]="toastDuration">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      perspective: 1000px;
    }
    .toast {
      min-width: 320px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.95);
      animation: toastEnter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      transition: opacity 0.3s ease;
    }
    .toast.fade-out {
      opacity: 0;
    }
    
    .toast-progress {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      width: 100%;
    }
    .toast-progress-bar {
      height: 100%;
      width: 100%;
      transform-origin: left;
      animation: shrink linear forwards;
    }
    
    /* RTL adjustments */
    :host-context([dir="rtl"]) .toast-progress-bar {
      transform-origin: right;
    }
    :host-context([dir="rtl"]) .toast {
      animation: toastEnterRtl 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    :host-context([dir="rtl"]) .me-3 { margin-right: 0 !important; margin-left: 1rem !important; }
    :host-context([dir="rtl"]) .ms-2 { margin-left: 0 !important; margin-right: 0.5rem !important; }

    @keyframes shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
    
    @keyframes toastEnter {
      from { transform: translateX(100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }

    @keyframes toastEnterRtl {
      from { transform: translateX(-100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
  ts = inject(TranslationService);
  
  toastDuration = 5000;

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-success bg-gradient text-white';
      case 'error': case 'danger': return 'bg-danger bg-gradient text-white';
      case 'warning': return 'bg-warning bg-gradient text-dark';
      case 'info': return 'bg-info bg-gradient text-white';
      default: return 'bg-primary bg-gradient text-white';
    }
  }

  getProgressClass(type: string): string {
    return 'bg-white';
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': case 'danger': return 'fas fa-circle-xmark';
      case 'warning': return 'fas fa-triangle-exclamation';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-bell';
    }
  }

  removeToast(id: any) {
    // Note: The actual removal with fade out is ideally handled by the service,
    // but here we trigger the service remove immediately.
    this.toastService.remove(id);
  }
}
