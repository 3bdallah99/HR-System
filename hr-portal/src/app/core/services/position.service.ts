import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse, PaginatedResult, Position } from '../util/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/position`;

  getAll(page = 1, pageSize = 20, title?: string, departmentId?: number) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (title) params = params.set('title', title);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<ApiResponse<PaginatedResult<Position>>>(this.baseUrl, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Position>>(`${this.baseUrl}/${id}`);
  }

  create(dto: { title: string; baseSalary: number; departmentId: number }) {
    return this.http.post<ApiResponse<number>>(this.baseUrl, dto);
  }

  update(id: number, dto: { title: string; baseSalary: number; departmentId: number }) {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/${id}`);
  }
}
