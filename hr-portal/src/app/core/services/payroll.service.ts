import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ApiResponse,
  PaginatedResult,
  SalaryStructure,
  SetSalaryStructureDto,
  PayrollSlip,
  PayrollMonthSummary,
  RunPayrollDto,
  RunPayrollResult,
  UpdatePayrollDto
} from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payroll`;

  getSalaryStructure(employeeId: number) {
    return this.http.get<ApiResponse<SalaryStructure>>(
      `${this.baseUrl}/salary-structure/${employeeId}`
    );
  }

  setSalaryStructure(employeeId: number, dto: SetSalaryStructureDto) {
    return this.http.post<ApiResponse<string>>(
      `${this.baseUrl}/salary-structure/${employeeId}`,
      dto
    );
  }

  getByEmployee(employeeId: number, year?: number, page = 1, pageSize = 12) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<PaginatedResult<PayrollSlip>>>(
      `${this.baseUrl}/employee/${employeeId}`,
      { params }
    );
  }

  getByMonth(month: number, year: number, departmentId?: number) {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ApiResponse<PayrollMonthSummary>>(
      `${this.baseUrl}/month/${month}/year/${year}`,
      { params }
    );
  }

  run(dto: RunPayrollDto) {
    return this.http.post<ApiResponse<RunPayrollResult>>(`${this.baseUrl}/run`, dto);
  }

  update(id: number, dto: UpdatePayrollDto) {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}`, dto);
  }

  runPayroll(month: number, year: number) {
    return this.http.post<any>(`${this.baseUrl}/run`, { month, year });
  }

  getPayslips(month: number, year: number) {
    return this.getByMonth(month, year);
  }

  getAllSalaryStructures() {
    return this.http.get<ApiResponse<SalaryStructure[]>>(`${this.baseUrl}/salary-structures`);
  }

  getSalaryStructures() {
    return this.getAllSalaryStructures();
  }

  createSalaryStructure(form: any) {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salary-structure`, form);
  }

  updateSalaryStructure(employeeId: number, form: any) {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salary-structure/${employeeId}`, form);
  }

  deleteSalaryStructure(employeeId: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/salary-structure/${employeeId}`);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
