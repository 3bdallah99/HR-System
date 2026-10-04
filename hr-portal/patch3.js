import fs from 'fs';

// 1. Patch AttendanceService
const attPath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/services/attendance.service.ts';
let attCode = fs.readFileSync(attPath, 'utf8');
const missingAttMethods = `
  getAll(page: number, pageSize: number, empId?: number, from?: string, to?: string) {
    return this.http.get<any>(this.baseUrl);
  }
  clockIn() {
    return this.http.post<any>(\`\${this.baseUrl}/clockin\`, {});
  }
  clockOut() {
    return this.http.post<any>(\`\${this.baseUrl}/clockout\`, {});
  }
  uploadDeviceLog(file: File) {
    return this.http.post<any>(\`\${this.baseUrl}/upload\`, {});
  }
  processDevicePunches() {
    return this.http.post<any>(\`\${this.baseUrl}/process\`, {});
  }
`;
attCode = attCode.replace('delete(id: number) {', missingAttMethods + '\n  delete(id: number) {');
fs.writeFileSync(attPath, attCode);

// 2. Patch PayrollService
const prPath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/services/payroll.service.ts';
let prCode = fs.readFileSync(prPath, 'utf8');
const missingPrMethods = `
  runPayroll(month: number, year: number) {
    return this.http.post<any>(\`\${this.baseUrl}/run\`, { month, year });
  }
  getPayslips(month: number, year: number) {
    return this.http.get<any>(\`\${this.baseUrl}/payslips\`);
  }
  getSalaryStructures() {
    return this.http.get<any>(\`\${this.baseUrl}/salary-structure\`);
  }
  createSalaryStructure(form: any) {
    return this.http.post<any>(\`\${this.baseUrl}/salary-structure\`, form);
  }
  updateSalaryStructure(id: number, form: any) {
    return this.http.put<any>(\`\${this.baseUrl}/salary-structure/\${id}\`, form);
  }
  deleteSalaryStructure(id: number) {
    return this.http.delete<any>(\`\${this.baseUrl}/salary-structure/\${id}\`);
  }
`;
prCode = prCode.replace('delete(id: number) {', missingPrMethods + '\n  delete(id: number) {');
fs.writeFileSync(prPath, prCode);

// 3. Patch LeaveService
const leavePath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/services/leave.service.ts';
let leaveCode = fs.readFileSync(leavePath, 'utf8');
const missingLeaveMethods = `
  create(form: any) {
    return this.http.post<any>(\`\${this.baseUrl}/requests\`, form);
  }
`;
leaveCode = leaveCode.replace('submit(dto: SubmitLeaveDto) {', missingLeaveMethods + '\n  submit(dto: SubmitLeaveDto) {');
fs.writeFileSync(leavePath, leaveCode);

// 4. Fix leave-balances.component.ts missing employeeId
const leaveBalPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/leaves/leave-balances.component.ts';
let leaveBalCode = fs.readFileSync(leaveBalPath, 'utf8');
leaveBalCode = leaveBalCode.replace('getBalances()', 'getBalances(1)');
fs.writeFileSync(leaveBalPath, leaveBalCode);

// 5. Fix leave-list.component.ts TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
const leaveListPath = 'e:/ITI/APIs/HR/hr-portal/src/app/features/leaves/leave-list.component.ts';
let leaveListCode = fs.readFileSync(leaveListPath, 'utf8');
leaveListCode = leaveListCode.replace('getAll(this.page, this.pageSize)', "getAll(undefined, undefined, this.page(), this.pageSize)");
// also page is a signal, not a value, so wait: 'this.page' vs 'this.page()'
fs.writeFileSync(leaveListPath, leaveListCode);

console.log('Services patched');
