import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ApiResponse,
  PaginatedResult,
  AttendancePaginatedResult,
  AttendanceRecord,
  DepartmentAttendance,
  TardinessSummary,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  UploadAttendanceSheetResult,
  MonthlyAttendanceMatrix
} from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/attendance`;

  getByEmployee(employeeId: number, from?: string, to?: string, page = 1, pageSize = 31) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<PaginatedResult<AttendanceRecord>>>(
      `${this.baseUrl}/employee/${employeeId}`,
      { params }
    );
  }

  getDepartmentByDate(departmentId: number, date: string) {
    return this.http.get<ApiResponse<DepartmentAttendance>>(
      `${this.baseUrl}/department/${departmentId}/date/${date}`
    );
  }

  getTardiness(employeeId: number, year: number, month: number) {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<ApiResponse<TardinessSummary>>(
      `${this.baseUrl}/tardiness/${employeeId}`,
      { params }
    );
  }

  create(dto: CreateAttendanceDto) {
    return this.http.post<ApiResponse<number>>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateAttendanceDto) {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}`, dto);
  }

  
  getAll(page: number, pageSize: number, empId?: number, from?: string, to?: string, status?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (empId) params = params.set('employeeId', empId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<AttendancePaginatedResult<any>>>(this.baseUrl, { params });
  }

  uploadAttendanceSheet(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<ApiResponse<UploadAttendanceSheetResult>>(`${this.baseUrl}/upload`, formData);
  }

  downloadTemplate(format: 'excel' | 'csv' = 'excel') {
    return this.http.get(`${this.baseUrl}/template?format=${format}`, {
      responseType: 'blob'
    });
  }

  getMonthlyMatrix(year: number, month: number, departmentId?: number, isPayrollCycle = false) {
    let params = new HttpParams()
      .set('year', year)
      .set('month', month)
      .set('isPayrollCycle', isPayrollCycle);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ApiResponse<MonthlyAttendanceMatrix>>(
      `${this.baseUrl}/monthly-matrix`,
      { params }
    );
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
