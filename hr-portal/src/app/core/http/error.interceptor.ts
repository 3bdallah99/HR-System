import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.status === 401) {
        authService.logout();
        toastService.error('Session expired. Please log in again.', 'Unauthorized');
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (error.status === 403) {
        toastService.error('You do not have permission to perform this action.', 'Access Denied');
        return throwError(() => error);
      }

      // Handle ApiResponse error shape or problem details
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
          if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
            errorMessage += ': ' + error.error.errors.join(', ');
          }
        } else if (error.error.errors && typeof error.error.errors === 'object') {
          // ASP.NET ValidationProblemDetails
          const validationErrors = Object.values(error.error.errors).flat();
          if (validationErrors.length > 0) {
            errorMessage = validationErrors.join(' ');
          }
        } else if (error.error.title) {
          errorMessage = error.error.title;
        }
      }

      toastService.error(errorMessage, `Error (${error.status || 'Network'})`);
      return throwError(() => error);
    })
  );
};
