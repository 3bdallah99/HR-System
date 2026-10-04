import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper" [dir]="ts.isRtl() ? 'rtl' : 'ltr'">
      <!-- Floating Ambient Background Shapes -->
      <div class="animated-bg">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- Language Switcher Bar at top -->
      <div class="login-top-bar position-absolute top-0 end-0 p-4 z-20">
        <button class="btn btn-sm btn-glass rounded-pill px-3 shadow-sm d-flex align-items-center gap-2" 
                (click)="toggleLanguage()">
          <i class="fas fa-globe text-primary"></i>
          <span class="fw-bold">{{ ts.isRtl() ? 'English' : 'العربية' }}</span>
        </button>
      </div>
      
      <div class="login-card-container shadow-2xl glass-card">
        <!-- Brand Showcase Panel (Left in LTR, Right in RTL) -->
        <div class="brand-panel d-none d-lg-flex">
          <div class="brand-content">
            <div class="brand-badge mb-4 fade-in-up">
              <i class="fas fa-shield-halved me-2"></i>
              {{ ts.isRtl() ? 'منصة الموارد البشرية السحابية' : 'Enterprise HRMS Platform' }}
            </div>

            <h1 class="brand-headline fade-in-up">
              {{ ts.isRtl() ? 'الارتقاء بمستقبل' : 'Elevating the Future of' }}
              <span class="gradient-text">{{ ts.isRtl() ? 'الموارد البشرية' : 'Human Resources' }}</span>
            </h1>

            <p class="brand-subtext fade-in-up">
              {{ ts.isRtl() 
                ? 'إدارة متطورة لمسير الرواتب، وسجلات البصمة البيومترية، وإدارة شاملة لفرق العمل في مساحة رقمية واحدة وآمنة.'
                : 'Precision payroll engineering, biometric attendance ingestion, and streamlined employee operations in one unified workspace.' }}
            </p>

            <!-- Key System Highlights -->
            <div class="features-list mt-5 fade-in-up">
              <div class="feature-item">
                <div class="feature-icon"><i class="fas fa-fingerprint"></i></div>
                <div>
                  <div class="feature-title">
                    {{ ts.isRtl() ? 'مزامنة بصمة ZKTeco الذكية' : 'ZKTeco Biometric Sync' }}
                  </div>
                  <div class="feature-desc">
                    {{ ts.isRtl() ? 'احتساب تلقائي لفترات التأخير وقواعد الـ 60 دقيقة بدقة' : 'Automated 60-min tardiness rule calculations' }}
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon"><i class="fas fa-calculator"></i></div>
                <div>
                  <div class="feature-title">
                    {{ ts.isRtl() ? 'مركز مسير الرواتب الآلي' : 'Automated Payroll Hub' }}
                  </div>
                  <div class="feature-desc">
                    {{ ts.isRtl() ? 'هياكل رواتب مرنة واحتساب فوري للبدلات والخصومات' : 'Live salary structures and deduction audits' }}
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon"><i class="fas fa-calendar-check"></i></div>
                <div>
                  <div class="feature-title">
                    {{ ts.isRtl() ? 'إدارة الإجازات المباشرة' : 'Direct-to-HR Leaves' }}
                  </div>
                  <div class="feature-desc">
                    {{ ts.isRtl() ? 'موافقات فورية وتتبع ذكي وتوزيع دقيق لأرصدة الإجازات' : 'Zero-bottleneck instant balance allocation' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="brand-footer fade-in-up">
            <span class="text-footer-contrast">
              &copy; {{ currentYear }} {{ ts.isRtl() ? 'أنظمة الموارد البشرية للمؤسسات • بيئة عمل آمنة ومحمية' : 'Enterprise HR Systems. High-Security Environment.' }}
            </span>
          </div>
        </div>

        <!-- Authentication Form Panel -->
        <div class="form-panel">
          <div class="form-container fade-in">
            <div class="text-center mb-4">
              <div class="logo-icon mb-3">
                <i class="fas fa-cubes text-white fs-3"></i>
              </div>
              <h2 class="fw-bold text-card-title mb-1">
                {{ ts.isRtl() ? 'مرحباً بك مجدداً' : 'Welcome Back' }}
              </h2>
              <p class="text-muted small">
                {{ ts.isRtl() ? 'أدخل بيانات حسابك للوصول إلى لوحة الإدارة' : 'Enter your credentials to access the portal' }}
              </p>
            </div>

            <div *ngIf="errorMessage()" class="alert alert-danger d-flex align-items-center mb-4 border-0 shadow-sm shake-anim" role="alert">
              <i class="fas fa-circle-exclamation me-2 fs-5"></i>
              <div>{{ errorMessage() }}</div>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Email Input -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-card-title">
                  {{ ts.isRtl() ? 'البريد الإلكتروني' : 'Corporate Email' }}
                </label>
                <div class="input-group modern-input-group">
                  <span class="input-group-text bg-transparent border-0 text-muted ps-3">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control bg-transparent border-0 py-2"
                    formControlName="email"
                    [placeholder]="ts.isRtl() ? 'name@company.com' : 'name@company.com'"
                    autocomplete="email">
                </div>
                <div
                  *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid"
                  class="text-danger small mt-1 fade-in">
                  {{ ts.isRtl() ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Valid corporate email is required.' }}
                </div>
              </div>

              <!-- Password Input -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label small fw-bold text-card-title mb-0">
                    {{ ts.isRtl() ? 'كلمة المرور' : 'Password' }}
                  </label>
                  <span class="text-muted small">{{ ts.isRtl() ? '6 أحرف كحد أدنى' : 'Min. 6 chars' }}</span>
                </div>
                <div class="input-group modern-input-group">
                  <span class="input-group-text bg-transparent border-0 text-muted ps-3">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control bg-transparent border-0 py-2"
                    formControlName="password"
                    [placeholder]="ts.isRtl() ? 'أدخل كلمة المرور' : 'Enter account password'"
                    autocomplete="current-password">
                  <button
                    type="button"
                    class="input-group-text bg-transparent border-0 text-muted cursor-pointer pe-3"
                    (click)="showPassword = !showPassword">
                    <i class="fas" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
                <div
                  *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid"
                  class="text-danger small mt-1 fade-in">
                  {{ ts.isRtl() ? 'كلمة المرور مطلوبة' : 'Password is required.' }}
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold shadow-md"
                [disabled]="loginForm.invalid || isLoading()">
                <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <span>{{ ts.isRtl() ? 'تسجيل الدخول للنظام' : 'Sign In to Portal' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: radial-gradient(circle at 10% 20%, #0f172a 0%, #1e293b 90%);
      position: relative;
      overflow: hidden;
      font-family: inherit;
    }

    .animated-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .shape {
      position: absolute;
      filter: blur(80px);
      border-radius: 50%;
      opacity: 0.45;
      animation: float 14s infinite alternate ease-in-out;
    }
    .shape-1 {
      width: 450px; height: 450px;
      background: #4f46e5;
      top: -100px; left: -100px;
    }
    .shape-2 {
      width: 400px; height: 400px;
      background: #0284c7;
      bottom: -80px; right: -80px;
      animation-delay: -5s;
    }
    .shape-3 {
      width: 320px; height: 320px;
      background: #7c3aed;
      top: 30%; left: 40%;
      animation-delay: -2s;
    }
    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(30px, 50px) scale(1.1); }
    }

    .btn-glass {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      transition: all 0.2s ease;
    }
    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .glass-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }

    .login-card-container {
      width: 100%;
      max-width: 1060px;
      min-height: 640px;
      display: flex;
      border-radius: 28px;
      overflow: hidden;
      z-index: 10;
      position: relative;
    }

    .brand-panel {
      flex: 1.15;
      background: rgba(15, 23, 42, 0.65);
      padding: 3.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-inline-end: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-headline {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .gradient-text {
      background: linear-gradient(135deg, #818cf8 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtext {
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.7;
      margin-top: 1rem;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 16px;
      border-radius: 20px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(129, 140, 248, 0.3);
      color: #c7d2fe;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1.3rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      color: #38bdf8;
      flex-shrink: 0;
    }

    .feature-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #f8fafc;
    }

    .feature-desc {
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .text-footer-contrast {
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .form-panel {
      flex: 1;
      padding: 3.5rem 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(30, 41, 59, 0.6);
    }

    .form-container {
      width: 100%;
      max-width: 380px;
    }

    .text-card-title {
      color: #f8fafc;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }

    .modern-input-group {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(15, 23, 42, 0.5);
      transition: all 0.25s ease;
    }
    .modern-input-group:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .modern-input-group .form-control {
      color: #ffffff;
    }
    .modern-input-group .form-control::placeholder {
      color: #64748b;
    }

    .btn-premium {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      border: none;
      transition: all 0.25s ease;
      color: white;
    }
    .btn-premium:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.5);
    }

    @media (max-width: 992px) {
      .login-card-container { min-height: auto; }
      .brand-panel { display: none !important; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  public ts = inject(TranslationService);
  private document = inject(DOCUMENT);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = false;
  currentYear = new Date().getFullYear();

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    effect(() => {
      const lang = this.ts.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.document.documentElement.dir = dir;
      this.document.documentElement.lang = lang;
    });
  }

  toggleLanguage() {
    this.ts.toggleLang();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res && res.success !== false) {
          this.toastService.show(this.ts.isRtl() ? 'تم تسجيل الدخول بنجاح' : 'Welcome back! Signed in successfully', 'success');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(res?.message || (this.ts.isRtl() ? 'فشل تسجيل الدخول. يرجى التحقق من البيانات.' : 'Login failed. Please verify credentials.'));
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err.error?.message || (this.ts.isRtl() ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.');
        this.errorMessage.set(msg);
      }
    });
  }
}
