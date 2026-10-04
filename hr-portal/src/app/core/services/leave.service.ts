import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ApiResponse,
  PaginatedResult,
  LeaveRequest,
  EmployeeLeaveRequest,
  LeaveBalance,
  SubmitLeaveDto,
  SetLeaveBalanceDto
} from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/leave`;

  getByEmployee(employeeId: number, status?: string, year?: number, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<PaginatedResult<EmployeeLeaveRequest>>>(
      `${this.baseUrl}/requests/employee/${employeeId}`,
      { params }
    );
  }

  getAll(status?: string, departmentId?: number, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ApiResponse<PaginatedResult<LeaveRequest>>>(
      `${this.baseUrl}/requests`,
      { params }
    );
  }

  getBalances(employeeId: number, year?: number) {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<LeaveBalance[]>>(
      `${this.baseUrl}/balances/${employeeId}`,
      { params }
    );
  }

  
  create(form: any) {
    return this.http.post<any>(`${this.baseUrl}/requests`, form);
  }

  submit(dto: SubmitLeaveDto) {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/requests`, dto);
  }

  approve(id: number) {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/requests/${id}/approve`, {});
  }

  reject(id: number, rejectionNote?: string) {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/requests/${id}/reject`, {
      rejectionNote
    });
  }

  cancel(id: number, employeeId: number) {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/requests/${id}`, { params });
  }

  setBalance(dto: SetLeaveBalanceDto) {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/balances`, dto);
  }
}
