import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const token = auth.getToken();
  if (!token) {
    router.navigateByUrl('/login');
    return false;
  }

  // Opcional: podríamos llamar a auth.me() aquí, pero evitar navegación asincrónica compleja.
  return true;
};