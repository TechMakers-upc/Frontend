import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '../../application/session.store';
import { Role } from '../../domain/model/role';
import { ROLE_HOME } from './role-presentation';

export const signedInGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const queryParams = state.url === '/' ? {} : { returnUrl: state.url };
  return session.isSignedIn() || inject(Router).createUrlTree(['/demo'], { queryParams });
};

export const signedOutGuard: CanActivateFn = () => {
  const role = inject(SessionStore).role();
  return role === null || inject(Router).createUrlTree([ROLE_HOME[role]]);
};

export function roleGuard(...allowed: Role[]): CanActivateFn {
  return () => {
    const role = inject(SessionStore).role();
    const router = inject(Router);
    if (role === null) return router.createUrlTree(['/demo']);
    return allowed.includes(role) || router.createUrlTree([ROLE_HOME[role]]);
  };
}

export const homeRedirectGuard: CanActivateFn = () => {
  const role = inject(SessionStore).role();
  return inject(Router).createUrlTree([role ? ROLE_HOME[role] : '/demo']);
};
