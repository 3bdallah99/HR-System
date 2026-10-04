import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiResponse } from '../util/models';

import { environment } from '../../../environments/environment';

export interface UserSession {
  userId: string;
  email: string;
  role: 'HR' | 'Employee';
  employeeId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'hrms_token';
  
  currentUser = signal<UserSession | null>(this.loadUserFromStorage());
  isAuthenticated = computed(() => !!this.currentUser());
  isHR = computed(() => this.currentUser()?.role === 'HR');

  login(email: string, password: string) {
    return this.http.post<ApiResponse<string>>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data);
          const session = this.decodeToken(res.data);
          this.currentUser.set(session);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<ApiResponse<string>>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): 'HR' | 'Employee' | null {
    return this.currentUser()?.role ?? null;
  }

  getEmployeeId(): number | null {
    return this.currentUser()?.employeeId ?? null;
  }

  private loadUserFromStorage(): UserSession | null {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }

  private decodeToken(token: string): UserSession | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem(this.TOKEN_KEY);
        return null;
      }

      // Role claim can be 'role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role', etc.
      const roleClaim = payload['role'] || 
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
        'Employee';

      // NameIdentifier / sub
      const userId = payload['sub'] || 
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
        payload['nameid'] || '';

      // Email
      const email = payload['email'] || 
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
        '';

      // EmployeeId claim
      const rawEmpId = payload['EmployeeId'] || payload['employeeId'];
      const employeeId = rawEmpId ? parseInt(rawEmpId, 10) : undefined;

      return {
        userId,
        email,
        role: roleClaim as 'HR' | 'Employee',
        employeeId: isNaN(employeeId as number) ? undefined : employeeId
      };
    } catch {
      return null;
    }
  }
}
