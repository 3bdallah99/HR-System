import fs from 'fs';
import path from 'path';

function replaceAll(str, mapObj) {
  const re = new RegExp(Object.keys(mapObj).join("|"), "gi");
  return str.replace(re, function(matched){
    return mapObj[matched];
  });
}

// 1. Patch employee-list.component.ts
const empPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/employees/employee-list.component.ts';
let empCode = fs.readFileSync(empPath, 'utf8');

empCode = empCode.replace(
  /item\.firstName\.charAt\(0\)\s*\}\}\{\{\s*item\.lastName\.charAt\(0\)/g,
  "item.name?.charAt(0) }}{{ item.name?.split(' ')?.[1]?.charAt(0) || ''"
);
empCode = empCode.replace(
  /\{\{\s*item\.firstName\s*\}\}\s*\{\{\s*item\.lastName\s*\}\}/g,
  "{{ item.name }}"
);
empCode = empCode.replace(/item\.phoneNumber/g, "item.phone");
empCode = empCode.replace(/item\.salary/g, "item.baseSalary");
empCode = empCode.replace(/emp\.firstName/g, "emp.name");
empCode = empCode.replace(/\|\|\s*emp\.lastName\.toLowerCase\(\)\.includes\(term\)/g, "");

fs.writeFileSync(empPath, empCode);

// 2. Patch department-list.component.ts
const deptPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/departments/department-list.component.ts';
let deptCode = fs.readFileSync(deptPath, 'utf8');

// replace 'item.description' in template with 'item.employeeCount' / 'item.positionCount'
// Let's just fix the header and data.
deptCode = deptCode.replace(
  /<th class="py-3 px-4">\{\{ ts\.t\(\)\.departments\.description \}\}<\/th>/g,
  `<th class="py-3 px-4">{{ ts.t().departments.employeeCount || 'Employee Count' }}</th>
                  <th class="py-3 px-4">{{ ts.t().departments.positionCount || 'Position Count' }}</th>`
);
deptCode = deptCode.replace(
  /<td class="px-4 py-3 text-muted">\{\{ item\.description \}\}<\/td>/g,
  `<td class="px-4 py-3 text-muted">{{ item.employeeCount }}</td>
                    <td class="px-4 py-3 text-muted">{{ item.positionCount }}</td>`
);
deptCode = deptCode.replace(
  /\|\|\s*\(item\.description && item\.description\.toLowerCase\(\)\.includes\(term\)\)/g,
  ""
);

fs.writeFileSync(deptPath, deptCode);

// 3. Patch position-list.component.ts
const posPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/positions/position-list.component.ts';
let posCode = fs.readFileSync(posPath, 'utf8');

// replace description with baseSalary and departmentName
posCode = posCode.replace(
  /<th class="py-3 px-4">\{\{ ts\.t\(\)\.positions\.description \}\}<\/th>/g,
  `<th class="py-3 px-4">{{ ts.t().positions.baseSalary || 'Base Salary' }}</th>
                  <th class="py-3 px-4">{{ ts.t().positions.departmentName || 'Department' }}</th>`
);
posCode = posCode.replace(
  /<td class="px-4 py-3 text-muted">\{\{ item\.description \}\}<\/td>/g,
  `<td class="px-4 py-3 text-muted">{{ item.baseSalary | currency }}</td>
                    <td class="px-4 py-3 text-muted"><span class="badge badge-active">{{ item.departmentName }}</span></td>`
);
posCode = posCode.replace(
  /\|\|\s*\(item\.description && item\.description\.toLowerCase\(\)\.includes\(term\)\)/g,
  ""
);

fs.writeFileSync(posPath, posCode);

// 4. Inject Bootstrap Dark Mode Overrides in styles.scss
const stylesPath = 'e:/ITI/APIs/HR/hr-portal/src/styles.scss';
let stylesCode = fs.readFileSync(stylesPath, 'utf8');

const darkModeFix = `
/* Bootstrap Dark Mode Overrides */
[data-theme='dark'] {
  --bs-body-bg: var(--slate-100);
  --bs-body-color: var(--navy);
  
  .bg-white { background-color: var(--slate-50) !important; }
  .table { color: var(--navy); }
  .table-light { background-color: var(--slate-200) !important; color: var(--navy) !important; }
  .table-light th { background-color: var(--slate-200) !important; color: var(--navy) !important; border-bottom-color: var(--slate-300) !important; }
  .table > :not(caption) > * > * { background-color: transparent !important; color: var(--navy) !important; border-bottom-color: var(--slate-300) !important; }
  
  .text-dark { color: #f8fafc !important; }
  .text-muted { color: var(--slate-400) !important; }
  .card { background-color: var(--slate-50) !important; }
  .card-footer { background-color: var(--slate-50) !important; border-top-color: var(--slate-300) !important; }
  
  .form-control, .form-select, .input-group-text { 
    background-color: var(--slate-100) !important; 
    border-color: var(--slate-300) !important; 
    color: var(--navy) !important; 
  }
  .form-control:focus {
    background-color: var(--slate-100) !important;
    color: var(--navy) !important;
  }
}
`;

if (!stylesCode.includes('Bootstrap Dark Mode Overrides')) {
  stylesCode += darkModeFix;
  fs.writeFileSync(stylesPath, stylesCode);
}

console.log('UI Patched successfully');
