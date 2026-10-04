import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse, PaginatedResult, Department, DepartmentDetail } from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/department`;

  getAll(page = 1, pageSize = 10, name?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (name) params = params.set('name', name);
    return this.http.get<ApiResponse<PaginatedResult<Department>>>(this.baseUrl, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<DepartmentDetail>>(`${this.baseUrl}/${id}`);
  }

  create(dto: { name: string }) {
    return this.http.post<ApiResponse<number>>(this.baseUrl, dto);
  }

  update(id: number, dto: { name: string }) {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
