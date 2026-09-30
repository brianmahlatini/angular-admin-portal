import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api';
import { AuthService } from './auth.service';

/**
 * Adds the bearer token, but only to our own API: a token must never leak to
 * third-party URLs. A 401 from the API ends the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const base = inject(API_BASE_URL);
  const ours = req.url.startsWith(`${base}/`);
  const token = auth.token();
  const authed = ours && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (ours && err instanceof HttpErrorResponse && err.status === 401 && !req.url.endsWith('/api/auth/login')) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
