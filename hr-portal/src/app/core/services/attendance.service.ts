import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ApiResponse,
  PaginatedResult,
  AttendanceRecord,
  DepartmentAttendance,
  TardinessSummary,
  DeviceLog,
  CreateAttendanceDto,
  UpdateAttendanceDto
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

  
  getAll(page: number, pageSize: number, empId?: number, from?: string, to?: string) {
    return this.http.get<any>(this.baseUrl);
  }
  clockIn() {
    return this.http.post<any>(`${this.baseUrl}/clockin`, {});
  }
  clockOut() {
    return this.http.post<any>(`${this.baseUrl}/clockout`, {});
  }
  uploadDeviceLog(file: File) {
    return this.http.post<any>(`${this.baseUrl}/upload`, {});
  }
  processDevicePunches() {
    return this.http.post<any>(`${this.baseUrl}/process`, {});
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }

  getDeviceLogs(
    deviceSerial?: string,
    userPin?: string,
    employeeId?: number,
    from?: string,
    to?: string,
    isProcessed?: boolean,
    page = 1,
    pageSize = 50
  ) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (deviceSerial) params = params.set('deviceSerial', deviceSerial);
    if (userPin) params = params.set('userPin', userPin);
    if (employeeId) params = params.set('employeeId', employeeId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (isProcessed !== undefined && isProcessed !== null) params = params.set('isProcessed', isProcessed);
    return this.http.get<ApiResponse<PaginatedResult<DeviceLog>>>(`${this.baseUrl}/device-logs`, { params });
  }
}
