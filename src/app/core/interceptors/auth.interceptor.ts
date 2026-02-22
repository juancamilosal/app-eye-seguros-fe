import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const isAuthEndpoint = (url: string): boolean => {
    const u = url.toLowerCase();
    return u.includes('/auth/login') || u.includes('/auth/refresh') || u.includes('/auth/logout');
  };

  const addAuth = (bearer: string | null) =>
    bearer
      ? req.clone({ setHeaders: { Authorization: `Bearer ${bearer}` } })
      : req;

  const authReq = isAuthEndpoint(req.url) ? req : addAuth(token);
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // No manejar refresco para endpoints de autenticación
      if (isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }
      // Manejo de token expirado: código 401 o payload con {errors: [{extensions: {code: 'TOKEN_EXPIRED'}}]}
      const isUnauthorized = error.status === 401;
      const isTokenExpired = (() => {
        try {
          const body: any = error.error;
          const code = body?.errors?.[0]?.extensions?.code;
          return code === 'TOKEN_EXPIRED';
        } catch {
          return false;
        }
      })();

      if (isUnauthorized || isTokenExpired) {
        return auth.refresh().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              return auth.logout().pipe(
                switchMap(() => {
                  router.navigateByUrl('/login');
                  return throwError(() => error);
                })
              );
            }
            const retryReq = addAuth(newToken);
            return next(retryReq);
          }),
          catchError(() => {
            return auth.logout().pipe(
              switchMap(() => {
                router.navigateByUrl('/login');
                return throwError(() => error);
              })
            );
          })
        );
      }
      return throwError(() => error);
    })
  );
};
