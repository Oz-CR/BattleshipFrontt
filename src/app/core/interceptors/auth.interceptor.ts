import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

 
  const isAuthRoute =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  const token = authService.getToken();

  // Headers básicos para LocalTunnel en todas las peticiones
  let headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  };

  // Agregar token de autorización si existe y no es ruta de auth
  if (token && !isAuthRoute) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Clonar la petición con los headers
  req = req.clone({
    setHeaders: headers
  });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/logout')) {
        authService.clearToken();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
