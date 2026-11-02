import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionStore } from '../application/session.store';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
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
        injector.get(SessionStore).signOut();
        void injector.get(Router).navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};