import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SignInRequest, SignInResponse } from './authentication-api.models';

@Injectable({ providedIn: 'root' })
export class AuthenticationApi {
  private readonly http = inject(HttpClient);
  private readonly signInUrl = `${environment.apiBaseUrl}/authentication/sign-in`;

  signIn(credentials: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(this.signInUrl, credentials);
  }
}
