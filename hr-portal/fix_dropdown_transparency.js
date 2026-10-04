import fs from 'fs';

// ==============================================================
// 1. FIX layout.component.ts
// ==============================================================
const layoutTsPath = 'e:/ITI/APIs/HR/hr-portal/src/app/layout/layout.component.ts';
let layoutTs = fs.readFileSync(layoutTsPath, 'utf8');

// Replace corrupted 'ط¹ط±ط¨ظٹ' with 'عربي'
layoutTs = layoutTs.replace(
  /ts\.currentLang\(\) === 'en' \? '[^']+' : 'English'/,
  "ts.currentLang() === 'en' ? 'عربي' : 'English'"
);

// Remove glass-panel from profile-dropdown
layoutTs = layoutTs.replace(
  '<div class="profile-dropdown glass-panel">',
  '<div class="profile-dropdown shadow-2xl">'
);

fs.writeFileSync(layoutTsPath, layoutTs);
console.log('✓ Fixed layout.component.ts (removed glass-panel, fixed Arabic text)');

// ==============================================================
// 2. FIX layout.component.scss
// ==============================================================
const layoutScssPath = 'e:/ITI/APIs/HR/hr-portal/src/app/layout/layout.component.scss';
let layoutScss = fs.readFileSync(layoutScssPath, 'utf8');

// Replace .profile-dropdown CSS block to be 100% solid, opaque with high z-index and shadow
layoutScss = layoutScss.replace(
  /\.profile-dropdown\s*\{[\s\S]*?transform-origin:\s*top right;/,
  `.profile-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 250px;
      border-radius: 18px;
      padding: 0.6rem;
      background: var(--bg-surface-solid, #ffffff) !important;
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
      z-index: 1060;
      animation: dropDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: top right;`
);

fs.writeFileSync(layoutScssPath, layoutScss);
console.log('✓ Fixed layout.component.scss (.profile-dropdown solid background, high z-index & shadow)');

// ==============================================================
// 3. ADD GLOBAL OVERRIDE IN styles.scss FOR .profile-dropdown
// ==============================================================
const stylesPath = 'e:/ITI/APIs/HR/hr-portal/src/styles.scss';
let stylesCode = fs.readFileSync(stylesPath, 'utf8');

const profileDropdownGlobal = `
/* Solid Opaque Profile Dropdown Menu */
.profile-dropdown {
  background-color: var(--bg-surface-solid, #ffffff) !important;
  opacity: 1 !important;
  z-index: 1060 !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.45) !important;
}

[data-theme='dark'] .profile-dropdown {
  background-color: #1e293b !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

[data-theme='dark'] .profile-dropdown .dropdown-header {
  border-bottom: 1px solid #334155 !important;
}

[data-theme='dark'] .profile-dropdown .dropdown-divider {
  background-color: #334155 !important;
}

[data-theme='dark'] .profile-dropdown .dropdown-item {
  color: #e2e8f0 !important;
}

[data-theme='dark'] .profile-dropdown .dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}
`;

if (!stylesCode.includes('Solid Opaque Profile Dropdown Menu')) {
  stylesCode += profileDropdownGlobal;
  fs.writeFileSync(stylesPath, stylesCode);
}
console.log('✓ Added global solid styles for .profile-dropdown in styles.scss');
