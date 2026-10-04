import fs from 'fs';

function replaceInFile(path, search, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
}

function replaceAllInFile(path, searchRegex, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(searchRegex, replace);
  fs.writeFileSync(path, content);
}

// 1. attendance.component.ts
replaceInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/attendance/attendance.component.ts',
  'this.attendanceSvc.getAll(this.page(), this.pageSize, this.filters.empId, this.filters.from, this.filters.to)',
  'this.attendanceSvc.getAll(this.page(), this.pageSize, Number(this.filters.empId) || undefined, this.filters.from, this.filters.to)'
);

// 2. department-list.component.ts
replaceInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/departments/department-list.component.ts',
  'req.subscribe({',
  '(req as any).subscribe({'
);

// 3. employee-list.component.ts
replaceInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/employees/employee-list.component.ts',
  'req.subscribe({',
  '(req as any).subscribe({'
);

// 4. position-list.component.ts
replaceInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/positions/position-list.component.ts',
  'req.subscribe({',
  '(req as any).subscribe({'
);

// 5. leave-list.component.ts
replaceInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/leaves/leave-list.component.ts',
  'getAll(undefined, undefined, this.page(), this.pageSize)',
  'getAll(undefined, undefined, this.page, this.pageSize)'
);

// 6. salary-structure.component.ts
replaceAllInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/payroll/salary-structure.component.ts',
  /this\.editingId\(\)!\s*,/g,
  'Number(this.editingId()!),'
);
replaceAllInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/payroll/salary-structure.component.ts',
  /deleteSalaryStructure\(id\)/g,
  'deleteSalaryStructure(Number(id))'
);

// 7. login.component.ts
replaceAllInFile(
  'e:/ITI/APIs/HR/hr-portal/src/app/features/auth/login.component.ts',
  /ts\.currentLang && ts\.currentLang\(\) ===/g,
  "ts.currentLang() ==="
);

console.log('Final patch applied');
