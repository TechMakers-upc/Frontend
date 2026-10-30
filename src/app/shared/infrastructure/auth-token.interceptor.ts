import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthTokenStorage } from './auth-token.storage';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthTokenStorage).read();

  const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  const isBackendRequest =
    request.url === apiBaseUrl ||
    request.url.startsWith(`${apiBaseUrl}/`);

  const isAuthenticationRequest =
    request.url.startsWith(`${apiBaseUrl}/authentication/`);

  if (!token || !isBackendRequest || isAuthenticationRequest) {
    return next(request);
  }

  const authorizedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authorizedRequest);
};
