import fs from 'fs';
import path from 'path';

console.log('=== STARTING COMPLETE UI/UX & DARK MODE OVERHAUL ===');

// ==========================================
// 1. FIX styles.scss GLOBALLY
// ==========================================
const stylesPath = 'e:/ITI/APIs/HR/hr-portal/src/styles.scss';
let stylesCode = fs.readFileSync(stylesPath, 'utf8');

// Ensure Dark Mode comprehensively covers ALL bootstrap classes and cards
const comprehensiveDarkMode = `
/* =========================================================
   COMPREHENSIVE DARK MODE & THEME SYSTEM OVERRIDES
   ========================================================= */
[data-theme='dark'], html[data-theme='dark'], body[data-theme='dark'] {
  --bg-body: #0f172a !important;
  --bg-surface: #1e293b !important;
  --bg-surface-solid: #1e293b !important;
  --text-primary: #f8fafc !important;
  --text-secondary: #94a3b8 !important;
  --border-color: #334155 !important;
  --slate-50: #1e293b !important;
  --slate-100: #0f172a !important;
  --slate-200: #1e293b !important;
  --slate-300: #334155 !important;
  --white: #1e293b !important;
  --navy: #f8fafc !important;
  --navy-light: #cbd5e1 !important;

  background-color: #0f172a !important;
  color: #f8fafc !important;

  // Global elements
  body, .layout-wrapper, .main-content, .content-area, .content-wrapper, .page-container {
    background-color: #0f172a !important;
    color: #f8fafc !important;
  }

  // Cards and containers
  .card, .premium-card, .glass-card, .stat-card {
    background-color: #1e293b !important;
    background: #1e293b !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  // Bootstrap utility overrides
  .bg-white, .bg-light {
    background-color: #1e293b !important;
    color: #f8fafc !important;
  }

  .text-dark {
    color: #f8fafc !important;
  }

  .text-muted {
    color: #94a3b8 !important;
  }

  // Tables
  .table {
    color: #f8fafc !important;
    border-color: #334155 !important;
  }

  .table-light, thead.bg-light, thead.table-light, tr.table-light, th.table-light, .table thead th {
    background-color: #243247 !important;
    background: #243247 !important;
    color: #cbd5e1 !important;
    border-bottom: 1px solid #334155 !important;
    border-color: #334155 !important;
  }

  .table tbody td, .table > :not(caption) > * > * {
    background-color: transparent !important;
    color: #e2e8f0 !important;
    border-bottom: 1px solid #283548 !important;
  }

  .table-hover tbody tr:hover td {
    background-color: rgba(255, 255, 255, 0.04) !important;
  }

  // Form Controls
  .form-control, .form-select, .input-group-text {
    background-color: #1e293b !important;
    border-color: #334155 !important;
    color: #f8fafc !important;
  }

  .form-control:focus, .form-select:focus {
    background-color: #1e293b !important;
    border-color: #60a5fa !important;
    color: #ffffff !important;
  }

  // Badges & Buttons
  .btn-light {
    background-color: rgba(255, 255, 255, 0.08) !important;
    border-color: transparent !important;
    color: #cbd5e1 !important;
  }
  .btn-light:hover {
    background-color: rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
  }

  .badge.bg-light {
    background-color: #334155 !important;
    color: #94a3b8 !important;
    border-color: #475569 !important;
  }

  .card-footer {
    background-color: #1e293b !important;
    border-top: 1px solid #334155 !important;
    color: #94a3b8 !important;
  }

  // Topbar and sidebar
  .topbar {
    background-color: rgba(30, 41, 59, 0.95) !important;
    border-color: #334155 !important;
  }

  .sidebar {
    background-color: #111827 !important;
    border-color: #1f2937 !important;
  }
}
`;

// Append or replace in styles.scss
if (stylesCode.includes('COMPREHENSIVE DARK MODE & THEME SYSTEM OVERRIDES')) {
  stylesCode = stylesCode.replace(/\/\* =+ COMPREHENSIVE DARK MODE[\s\S]*$/, comprehensiveDarkMode);
} else {
  stylesCode += '\n' + comprehensiveDarkMode;
}
fs.writeFileSync(stylesPath, stylesCode);
console.log('✓ Updated styles.scss with comprehensive dark mode system');


// ==========================================
// 2. FIX HARDCODED BACKGROUNDS IN ALL COMPONENTS
// ==========================================
const componentFiles = [
  'src/app/features/employees/employee-list.component.ts',
  'src/app/features/departments/department-list.component.ts',
  'src/app/features/positions/position-list.component.ts',
  'src/app/features/leaves/leave-list.component.ts',
  'src/app/features/leaves/leave-balances.component.ts',
  'src/app/features/attendance/attendance.component.ts',
  'src/app/features/attendance/device-logs.component.ts',
  'src/app/features/payroll/payroll-run.component.ts',
  'src/app/features/payroll/payslip-list.component.ts',
  'src/app/features/payroll/salary-structure.component.ts',
  'src/app/features/dashboard/dashboard.component.ts'
];

for (const relPath of componentFiles) {
  const fullPath = path.join('e:/ITI/APIs/HR/hr-portal', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let code = fs.readFileSync(fullPath, 'utf8');

  // Replace hardcoded light page backgrounds
  code = code.replace(/background-color:\s*#f8fafc;?/g, 'background-color: transparent;');
  code = code.replace(/background:\s*#f8fafc;?/g, 'background: transparent;');
  code = code.replace(/background:\s*#ffffff;?/g, 'background: var(--bg-surface-solid, #ffffff);');
  code = code.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.95\);?/g, 'background: var(--bg-surface-solid, #ffffff);');
  code = code.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.9\);?/g, 'background: var(--bg-surface-solid, #ffffff);');

  // Fix page-container min-height and padding so it integrates cleanly
  code = code.replace(/\.page-container\s*\{[^}]*\}/g, `
    .page-container {
      padding: 1.5rem 0;
      background-color: transparent;
      font-family: inherit;
    }
  `);

  fs.writeFileSync(fullPath, code);
  console.log(`✓ Cleaned styles in ${relPath}`);
}


// ==========================================
// 3. FIX DASHBOARD SPECIFIC STYLES & TRANSLATIONS
// ==========================================
const dashPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/dashboard/dashboard.component.ts';
let dashCode = fs.readFileSync(dashPath, 'utf8');

// Fix stat-card style in dashboard
dashCode = dashCode.replace(
  /\.stat-card\s*\{[\s\S]*?background:\s*#ffffff;[\s\S]*?\}/,
  `.stat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-radius: 1rem;
    background: var(--bg-surface-solid, #ffffff);
    color: var(--text-primary, #0f172a);
    border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8));
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    height: 100%;
  }`
);

// Fix stat-label text color for dark mode readability
dashCode = dashCode.replace(
  /\.stat-label\s*\{[\s\S]*?\}/,
  `.stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }`
);

// Fix translations in dashboard template
dashCode = dashCode.replace(
  /ts\.t\(\)\.dashboard\?\.awaitingHRReview \|\| 'Awaiting Direct HR Review'/g,
  "ts.t()?.dashboard?.awaitingReview || 'بانتظار المراجعة'"
);
dashCode = dashCode.replace(
  /ts\.t\(\)\.dashboard\?\.noPendingRequestsDesc \|\| 'No pending leave requests requiring HR review right now'/g,
  "ts.t()?.dashboard?.noPendingLeaveRequests || 'لا توجد طلبات إجازة معلقة'"
);
dashCode = dashCode.replace(
  /'View All'/g,
  "ts.t()?.common?.viewAll || 'عرض الكل'"
);
dashCode = dashCode.replace(
  /'Manage Employees'/g,
  "ts.t()?.dashboard?.manageEmployees || 'إدارة الموظفين'"
);
dashCode = dashCode.replace(
  /'Run Payroll'/g,
  "ts.t()?.dashboard?.runPayroll || 'إجراء الرواتب'"
);

fs.writeFileSync(dashPath, dashCode);
console.log('✓ Updated dashboard.component.ts with theme-aware styles & full translations');


// ==========================================
// 4. FIX LAYOUT COMPONENT SCSS & ENCAPSULATION
// ==========================================
const layoutScssPath = 'e:/ITI/APIs/HR/hr-portal/src/app/layout/layout.component.scss';
let layoutScss = fs.readFileSync(layoutScssPath, 'utf8');

// Ensure .content-area and .layout-wrapper use proper transparent/body backgrounds
layoutScss = layoutScss.replace(
  /\.layout-wrapper\s*\{[\s\S]*?min-height:\s*100vh;[\s\S]*?\}/,
  `.layout-wrapper {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-body, #f4f6f9);
    color: var(--text-primary, #1e293b);
    font-family: inherit;
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow-x: hidden;
  }`
);

fs.writeFileSync(layoutScssPath, layoutScss);
console.log('✓ Updated layout.component.scss');

console.log('=== COMPLETE OVERHAUL APPLIED SUCCESSFULLY ===');
