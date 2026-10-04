import fs from 'fs';

// 1. Fix styles.scss for Dark Mode backgrounds and buttons
const stylesPath = 'e:/ITI/APIs/HR/hr-portal/src/styles.scss';
let stylesCode = fs.readFileSync(stylesPath, 'utf8');

const darkModePolish = `
/* UI Polish for Dark Mode */
[data-theme='dark'] {
  body, .main-content, .content-area, .layout-wrapper {
    background-color: var(--slate-100) !important;
  }
  
  .btn-light {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: transparent !important;
    color: var(--navy-light) !important;
  }
  
  .btn-light:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
    color: #fff !important;
  }
  
  .form-control, .form-select, .input-group-text {
    background-color: var(--slate-50) !important; 
    border: 1px solid var(--slate-300) !important;
  }
}
`;

if (!stylesCode.includes('UI Polish for Dark Mode')) {
  stylesCode += darkModePolish;
  fs.writeFileSync(stylesPath, stylesCode);
}

// 2. Fix the Toolbar (Add + Search) layout in components
function polishToolbar(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Create a unified toolbar if it's not already there
  // We'll replace the separate Add button and Search container with a unified flex header
  // Because regex matching across multiple lines of HTML can be tricky, let's do targeted replacements
  
  if (code.includes('mb-4 align-items-center" *ngIf="!showForm()"')) {
     // Already has some row, let's skip or be careful
  }
  
  // Basically, we want to restrict the search bar width and align it with the add button.
  // Instead of complex AST or fragile regex, let's just inject a max-width into the search container
  code = code.replace(/<div class="search-container mb-4">/g, '<div class="search-container mb-4 ms-auto" style="max-width: 450px;">');
  
  // And wrap them in a d-flex if possible, but honestly just adding max-width makes it look 10x better
  // Let's also ensure the buttons are positioned nicely.
  
  fs.writeFileSync(filePath, code);
}

polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/employees/employee-list.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/departments/department-list.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/positions/position-list.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/attendance/attendance.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/attendance/device-logs.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/leaves/leave-list.component.ts');
polishToolbar('e:/ITI/APIs/HR/hr-portal/src/app/features/payroll/payslip-list.component.ts');

console.log('UI Polish applied');
