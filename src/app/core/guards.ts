import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Client-side guard for UX only; the API enforces the admin role on every request. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.user()) return router.createUrlTree(['/login']);
  return auth.isAdmin() ? true : router.createUrlTree(['/forbidden']);
};
