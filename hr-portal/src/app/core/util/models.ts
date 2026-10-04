// ─── Generic API Response ────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Employee ────────────────────────────────────────────────────────
export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  hireDate: string;
  isActive: boolean;
  positionId: number;
  positionTitle: string;
  baseSalary: number;
  departmentId: number;
  departmentName: string;
  managerId?: number;
  managerName?: string;
}

export interface CreateEmployeeDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  hireDate: string;
  positionId: number;
  departmentId: number;
  managerId?: number;
}

export interface UpdateEmployeeDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  hireDate: string;
  isActive: boolean;
  positionId: number;
  departmentId: number;
  managerId?: number;
}

// ─── Department ──────────────────────────────────────────────────────
export interface Department {
  id: number;
  name: string;
  employeeCount: number;
  positionCount: number;
}

export interface DepartmentDetail {
  id: number;
  name: string;
  employeeCount: number;
  positions: PositionSummary[];
}

export interface PositionSummary {
  id: number;
  title: string;
  baseSalary: number;
}

// ─── Position ────────────────────────────────────────────────────────
export interface Position {
  id: number;
  title: string;
  baseSalary: number;
  departmentId: number;
  departmentName: string;
}

// ─── Attendance ──────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  clockIn?: string;
  clockOut?: string;
  note?: string;
}

export interface DepartmentAttendance {
  departmentId: number;
  departmentName: string;
  date: string;
  employees: EmployeeAttendance[];
}

export interface EmployeeAttendance {
  employeeId: number;
  employeeName: string;
  attendanceRecordId?: number;
  status?: string;
  clockIn?: string;
  clockOut?: string;
  note?: string;
}

export interface TardinessSummary {
  employeeId: number;
  employeeName: string;
  year: number;
  month: number;
  lateOccurrences: number;
  totalLateMinutes: number;
  allowedMinutes: number;
  deductibleMinutes: number;
}

export interface DeviceLog {
  id: number;
  deviceSerial: string;
  userPin: string;
  employeeId?: number;
  employeeName?: string;
  punchTime: string;
  inOutMode: number;
  verifyMode: number;
  workCode?: string;
  isProcessed: boolean;
  errorMessage?: string;
  receivedAt: string;
}

export interface CreateAttendanceDto {
  employeeId: number;
  date: string;
  status: number;
  clockIn?: string;
  clockOut?: string;
  lateMinutes: number;
  note?: string;
}

export interface UpdateAttendanceDto {
  status: number;
  clockIn?: string;
  clockOut?: string;
  lateMinutes: number;
  note?: string;
}

// ─── Leave ───────────────────────────────────────────────────────────
export interface LeaveRequest {
  id: number;
  employeeName: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  requestedAt: string;
}

export interface EmployeeLeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  rejectionNote?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedByName?: string;
}

export interface LeaveBalance {
  id: number;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface SubmitLeaveDto {
  employeeId: number;
  leaveType: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface SetLeaveBalanceDto {
  employeeId: number;
  year: number;
  leaveType: number;
  totalDays: number;
}

// ─── Payroll ─────────────────────────────────────────────────────────
export interface SalaryStructure {
  employeeId: number;
  employeeName: string;
  basicSalary: number;
  housingAllowance: number;
  transportationAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  totalEarnings: number;
  socialInsurance: number;
  taxAmount: number;
  otherDeductions: number;
  totalFixedDeductions: number;
  estimatedGross: number;
  lastUpdatedAt: string;
}

export interface SetSalaryStructureDto {
  basicSalary: number;
  housingAllowance: number;
  transportationAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  socialInsurance: number;
  taxAmount: number;
  otherDeductions: number;
}

export interface PayrollSlip {
  id: number;
  month: number;
  year: number;
  paymentDate: string;
  basicSalary: number;
  housingAllowance: number;
  transportationAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  grossPay: number;
  absenceDeduction: number;
  tardinessDeductionMinutes: number;
  tardinessDeduction: number;
  socialInsurance: number;
  taxAmount: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  workingDaysInMonth: number;
  daysPresent: number;
  daysAbsent: number;
  approvedLeaveDays: number;
  totalLateMinutes: number;
}

export interface PayrollMonthSummary {
  month: number;
  year: number;
  totalBasicSalary: number;
  totalGrossPay: number;
  totalOvertimePay: number;
  totalDeductions: number;
  totalNetPay: number;
  payslipsCount: number;
  payslips: PayrollSummaryItem[];
}

export interface PayrollSummaryItem {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  positionTitle: string;
  basicSalary: number;
  grossPay: number;
  overtimePay: number;
  absenceDeduction: number;
  tardinessDeduction: number;
  totalDeductions: number;
  netPay: number;
  daysPresent: number;
  daysAbsent: number;
  paymentDate: string;
}

export interface RunPayrollDto {
  month: number;
  year: number;
  employeeId?: number;
  departmentId?: number;
  workingDaysInMonth: number;
}

export interface RunPayrollResult {
  processedCount: number;
  skippedCount: number;
  totalNetPay: number;
}

export interface UpdatePayrollDto {
  overtimePay: number;
  otherDeductions: number;
}
