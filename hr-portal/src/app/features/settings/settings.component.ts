import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Lang } from '../../core/services/translation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container animate-fade-in-up" [class.rtl]="ts.isRtl()" [dir]="ts.isRtl() ? 'rtl' : 'ltr'">
      <!-- Header -->
      <div class="page-header mb-4">
        <div class="header-icon">
          <i class="fa-solid fa-gear"></i>
        </div>
        <div class="header-text">
          <h1 class="fw-bold mb-1">{{ ts.isRtl() ? 'إعدادات النظام والتفضيلات' : 'System Settings' }}</h1>
          <p class="text-muted mb-0">
            {{ ts.isRtl() ? 'إدارة تفضيلات الواجهة، اللغة، الوضع الليلي وخيارات الحساب' : 'Manage your preferences, language, theme and system configurations' }}
          </p>
        </div>
      </div>

      <div class="settings-content">
        <!-- Appearance Card -->
        <div class="settings-card card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div class="card-header border-0 d-flex align-items-center gap-2 p-3 bg-surface-header">
            <i class="fa-solid fa-paintbrush text-primary fs-5"></i>
            <h5 class="fw-bold mb-0 text-card-title">{{ ts.isRtl() ? 'المظهر وتجربة الاستخدام' : 'Appearance' }}</h5>
          </div>
          
          <div class="card-body p-4">
            <!-- Language Setting -->
            <div class="setting-item d-flex justify-content-between align-items-center flex-wrap gap-3 py-2">
              <div class="setting-info">
                <h6 class="fw-bold mb-1 text-card-title">{{ ts.isRtl() ? 'لغة النظام' : 'Language' }}</h6>
                <p class="text-muted small mb-0">{{ ts.isRtl() ? 'اختر لغة عرض واجهة المستخدم المفضلة لديك' : 'Select your preferred interface language' }}</p>
              </div>
              <div class="language-options d-flex gap-2">
                <button class="lang-btn btn rounded-pill px-3 py-2" [class.active]="ts.currentLang() === 'ar'" (click)="setLang('ar')">
                  <span class="me-1">🇸🇦</span>
                  <span class="fw-bold">العربية</span>
                </button>
                <button class="lang-btn btn rounded-pill px-3 py-2" [class.active]="ts.currentLang() === 'en'" (click)="setLang('en')">
                  <span class="me-1">🇬🇧</span>
                  <span class="fw-bold">English</span>
                </button>
              </div>
            </div>

            <div class="setting-divider my-3"></div>

            <!-- Theme Setting -->
            <div class="setting-item d-flex justify-content-between align-items-center flex-wrap gap-3 py-2">
              <div class="setting-info">
                <h6 class="fw-bold mb-1 text-card-title">{{ ts.isRtl() ? 'المظهر والوضع الليلي' : 'Theme Mode' }}</h6>
                <p class="text-muted small mb-0">{{ ts.isRtl() ? 'التبديل بين الوضع الداكن والوضع الفاتح' : 'Toggle between dark and light appearance' }}</p>
              </div>
              <div class="theme-toggle" dir="ltr">
                <label class="modern-switch">
                  <input type="checkbox" [checked]="darkMode()" (change)="toggleDarkMode()">
                  <span class="switch-slider round">
                    <i class="fa-solid fa-sun icon-sun" *ngIf="!darkMode()"></i>
                    <i class="fa-solid fa-moon icon-moon" *ngIf="darkMode()"></i>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- System Info / Coming Soon Card -->
        <div class="settings-card card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header border-0 d-flex align-items-center gap-2 p-3 bg-surface-header">
            <i class="fa-solid fa-server text-primary fs-5"></i>
            <h5 class="fw-bold mb-0 text-card-title">{{ ts.isRtl() ? 'إعدادات النظام المتقدمة' : 'System Configuration' }}</h5>
          </div>
          <div class="card-body p-4">
            <div class="coming-soon-box p-4 rounded-4 text-center">
              <div class="icon-pulse mb-3">
                <i class="fa-solid fa-rocket"></i>
              </div>
              <h5 class="fw-bold mb-2">{{ ts.isRtl() ? 'تكاملات إضافية قريباً' : 'Coming Soon' }}</h5>
              <p class="text-muted small mb-0 max-w-500 mx-auto">
                {{ ts.isRtl() ? 'إعدادات ربط أجهزة البصمة المتقدمة، وضبط قواعد الضرائب والتأمينات ستكون متاحة في التحديث القادم.' : 'Advanced biometric device sync and custom tax/insurance rules will be available in the next release.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 1rem 0;
    }
    .rtl { direction: rtl; }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .header-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.4rem;
      box-shadow: 0 8px 18px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
    }

    .settings-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }
    .bg-surface-header {
      background: rgba(0, 0, 0, 0.02);
      border-bottom: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }
    .text-card-title {
      color: var(--text-primary, #0f172a);
    }
    .setting-divider {
      height: 1px;
      background: var(--border-color, #e2e8f0);
    }

    /* Language Buttons */
    .lang-btn {
      border: 1px solid var(--border-color, #e2e8f0);
      background: rgba(0, 0, 0, 0.02);
      color: var(--text-secondary, #64748b);
      transition: all 0.2s ease;
    }
    .lang-btn:hover {
      background: rgba(59, 130, 246, 0.08);
      color: var(--text-primary, #0f172a);
    }
    .lang-btn.active {
      border-color: #3b82f6;
      background: #3b82f6;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    /* Flawless Modern Switch */
    .modern-switch {
      position: relative;
      display: inline-block;
      width: 58px;
      height: 32px;
    }
    .modern-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: var(--border-color, #cbd5e1);
      transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 34px;
      display: flex;
      align-items: center;
      padding: 0 6px;
    }
    .switch-slider:before {
      position: absolute;
      content: "";
      height: 24px;
      width: 24px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      z-index: 2;
    }
    input:checked + .switch-slider {
      background-color: #3b82f6;
    }
    input:checked + .switch-slider:before {
      transform: translateX(26px) !important;
    }
    .icon-sun, .icon-moon {
      font-size: 11px;
      color: white;
      z-index: 1;
      position: absolute;
    }
    .icon-sun { right: 9px; }
    .icon-moon { left: 9px; }

    /* Coming soon box */
    .coming-soon-box {
      background: rgba(0, 0, 0, 0.02);
      border: 1px dashed var(--border-color, #cbd5e1);
    }
    .icon-pulse {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      animation: pulse 2s infinite;
    }
    .max-w-500 { max-width: 500px; }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      70% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  ts = inject(TranslationService);
  darkMode = signal<boolean>(false);

  ngOnInit() {
    const savedTheme = localStorage.getItem('hr_theme');
    if (savedTheme === 'dark') {
      this.darkMode.set(true);
    }
  }

  setLang(lang: Lang) {
    if (this.ts.currentLang() !== lang) {
      this.ts.switchLang(lang);
    }
  }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    document.documentElement.setAttribute('data-theme', this.darkMode() ? 'dark' : 'light');
    localStorage.setItem('hr_theme', this.darkMode() ? 'dark' : 'light');
  }
}
