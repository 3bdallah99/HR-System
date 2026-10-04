import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse, PaginatedResult, Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employee`;

  getAll(page = 1, pageSize = 10, name?: string, email?: string, departmentId?: number) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (name) params = params.set('name', name);
    if (email) params = params.set('email', email);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ApiResponse<PaginatedResult<Employee>>>(this.baseUrl, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateEmployeeDto) {
    return this.http.post<ApiResponse<number>>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateEmployeeDto) {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
