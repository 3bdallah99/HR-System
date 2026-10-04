import { Component, computed, effect, inject, signal, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { TranslationService } from '../core/services/translation.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ReactiveFormsModule],
  template: `
    <div class="layout-wrapper" [attr.dir]="ts.isRtl() ? 'rtl' : 'ltr'" [class.rtl]="ts.isRtl()">
      <!-- Sidebar Overlay -->
      <div class="sidebar-overlay" [class.active]="isSidebarOpen()" (click)="toggleSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="isSidebarOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <span class="logo-text">{{ ts.t()?.common?.hrPortal || 'HR Portal' }}</span>
          </div>
          <button class="close-sidebar d-md-none" (click)="toggleSidebar()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="sidebar-nav custom-scrollbar">
          <ul class="nav-list">
            <li class="nav-label">{{ ts.t()?.common?.menu || 'Menu' }}</li>
            
            @for (item of navItems(); track item.path) {
              <li class="nav-item">
                <a [routerLink]="item.path" routerLinkActive="active" class="nav-link" (click)="closeSidebarOnMobile()">
                  <i class="fas" [ngClass]="item.icon"></i>
                  <span class="nav-text">{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
        
        <div class="sidebar-footer">
          <div class="user-info-mini">
            <div class="avatar">{{ getUserInitials() }}</div>
            <div class="user-details">
              <div class="name">{{ authService.currentUser()?.email?.split('@')?.[0] || 'User' }}</div>
              <div class="role-badge">{{ authService.currentUser()?.role }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="toggle-btn" (click)="toggleSidebar()">
              <i class="fas fa-bars"></i>
            </button>
            <h2 class="page-title">{{ getPageTitle() }}</h2>
          </div>

          <div class="topbar-right">
            <button class="action-btn" (click)="toggleTheme()" [title]="isDarkMode() ? 'Light Mode' : 'Dark Mode'">
              <i class="fas" [class.fa-moon]="!isDarkMode()" [class.fa-sun]="isDarkMode()"></i>
            </button>
            
            <button class="lang-btn" (click)="ts.toggleLang()">
              <i class="fas fa-globe"></i>
              <span>{{ ts.currentLang() === 'en' ? 'عربي' : 'English' }}</span>
            </button>

            <div class="profile-dropdown-container">
              <button class="profile-btn" (click)="toggleProfileMenu()">
                <div class="avatar-small">{{ getUserInitials() }}</div>
                <i class="fas fa-chevron-down text-muted chevron-icon"></i>
              </button>

              @if (isProfileMenuOpen()) {
                <div class="profile-dropdown shadow-2xl">
                  <div class="dropdown-header">
                    <div class="avatar-medium">{{ getUserInitials() }}</div>
                    <div class="user-meta">
                      <h6>{{ authService.currentUser()?.email }}</h6>
                      <span class="badge" [class.hr-badge]="authService.isHR()" [class.emp-badge]="!authService.isHR()">
                        {{ authService.currentUser()?.role }}
                      </span>
                    </div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" (click)="openChangePasswordModal()">
                    <i class="fas fa-key"></i>
                    <span>{{ ts.t()?.auth?.changePassword || 'Change Password' }}</span>
                  </button>
                  <button class="dropdown-item text-danger" (click)="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>{{ ts.t()?.auth?.logout || 'Logout' }}</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="content-area">
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>

    <!-- Change Password Modal -->
    @if (isChangePasswordModalOpen()) {
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-lock me-2 text-primary"></i>
                {{ ts.t()?.auth?.changePassword || 'Change Password' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeChangePasswordModal()"></button>
            </div>
            <div class="modal-body">
              <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
                <div class="form-floating mb-3">
                  <input type="password" class="form-control" id="currentPassword" formControlName="currentPassword" placeholder="Current Password">
                  <label for="currentPassword">{{ ts.t()?.auth?.currentPassword || 'Current Password' }}</label>
                  @if (passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.invalid) {
                    <div class="text-danger small mt-1">Required</div>
                  }
                </div>
                <div class="form-floating mb-3">
                  <input type="password" class="form-control" id="newPassword" formControlName="newPassword" placeholder="New Password">
                  <label for="newPassword">{{ ts.t()?.auth?.newPassword || 'New Password' }}</label>
                  @if (passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.invalid) {
                    <div class="text-danger small mt-1">Required</div>
                  }
                </div>
                <div class="d-flex justify-content-end mt-4">
                  <button type="button" class="btn btn-light me-2" (click)="closeChangePasswordModal()">
                    {{ ts.t()?.common?.cancel || 'Cancel' }}
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || isSubmitting()">
                    @if (isSubmitting()) {
                      <i class="fas fa-spinner fa-spin me-2"></i>
                    }
                    {{ ts.t()?.common?.save || 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  authService = inject(AuthService);
  ts = inject(TranslationService);
  toast = inject(ToastService);
  router = inject(Router);
  fb = inject(FormBuilder);
  document = inject(DOCUMENT);

  isSidebarOpen = signal(window.innerWidth > 992);
  isProfileMenuOpen = signal(false);
  isDarkMode = signal(false);
  isChangePasswordModalOpen = signal(false);
  isSubmitting = signal(false);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required]
  });

  navItems = computed(() => {
    const t = this.ts.t() || {};
    const nav = t.nav || {};
    if (this.authService.isHR()) {
      return [
        { path: '/dashboard', icon: 'fa-chart-pie', label: nav.dashboard || 'Dashboard' },
        { path: '/employees', icon: 'fa-user-friends', label: nav.employees || 'Employees' },
        { path: '/departments', icon: 'fa-sitemap', label: nav.departments || 'Departments' },
        { path: '/positions', icon: 'fa-briefcase', label: nav.positions || 'Positions' },
        { path: '/leaves', icon: 'fa-calendar-check', label: nav.leaves || 'Leaves' },
        { path: '/attendance', icon: 'fa-user-clock', label: nav.attendance || 'Attendance' },
        { path: '/attendance/device-logs', icon: 'fa-fingerprint', label: nav.deviceLogs || 'Device Logs' },
        { path: '/payroll/run', icon: 'fa-play-circle', label: nav.payrollRun || 'Payroll Run' },
        { path: '/payroll/payslips', icon: 'fa-file-invoice-dollar', label: nav.payslips || 'Payslips' },
        { path: '/payroll/salary-structures', icon: 'fa-sliders-h', label: nav.salaryStructures || 'Salary Structures' },
        { path: '/settings', icon: 'fa-cog', label: nav.settings || 'Settings' },
      ];
    } else {
      return [
        { path: '/dashboard', icon: 'fa-chart-pie', label: nav.dashboard || 'Dashboard' },
        { path: '/leaves', icon: 'fa-calendar-check', label: nav.myLeaves || 'My Leaves' },
        { path: '/leave-balances', icon: 'fa-hourglass-half', label: nav.leaveBalances || 'Leave Balances' },
        { path: '/attendance', icon: 'fa-user-clock', label: nav.myAttendance || 'My Attendance' },
        { path: '/payroll/payslips', icon: 'fa-file-invoice-dollar', label: nav.myPayslips || 'My Payslips' },
      ];
    }
  });

  constructor() {
    effect(() => {
      const isDark = this.isDarkMode();
      if (isDark) {
        this.document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        this.document.documentElement.removeAttribute('data-theme');
      }
    });

    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode.set(true);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 992) {
      this.isSidebarOpen.set(true);
    } else {
      this.isSidebarOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isProfileMenuOpen() && !target.closest('.profile-dropdown-container')) {
      this.isProfileMenuOpen.set(false);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 992) {
      this.isSidebarOpen.set(false);
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
  }

  getUserInitials(): string {
    const email = this.authService.currentUser()?.email || '';
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  getPageTitle(): string {
    const currentPath = this.router.url.split('?')[0];
    const match = this.navItems().find(item => currentPath.startsWith(item.path) && item.path !== '/');
    if (match) return match.label;
    if (currentPath === '/dashboard' || currentPath === '/') {
      return this.navItems()[0]?.label || 'Dashboard';
    }
    return '';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openChangePasswordModal() {
    this.isProfileMenuOpen.set(false);
    this.passwordForm.reset();
    this.isChangePasswordModalOpen.set(true);
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen.set(false);
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toast.show(this.ts.t()?.auth?.passwordChanged || 'Password changed successfully', 'success');
        this.closeChangePasswordModal();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.toast.show(err.message || 'Failed to change password', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}
