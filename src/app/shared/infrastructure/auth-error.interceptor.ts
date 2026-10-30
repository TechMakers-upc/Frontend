import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthTokenStorage } from './auth-token.storage';
import { SessionStore } from '../application/session.store';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(AuthTokenStorage);
  const sessionStore = inject(SessionStore);
  const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  const isBackendRequest =
    request.url === apiBaseUrl ||
    request.url.startsWith(`${apiBaseUrl}/`);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        isBackendRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        request.headers.has('Authorization')
      ) {
        sessionStore.signOut();
      }

      return throwError(() => error);
    }),
  );
};
