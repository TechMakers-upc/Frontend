import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserAccountResource } from './user-account.resource';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}${environment.usersEndpointPath}`;

  getAll(): Observable<UserAccountResource[]> {
    return this.http.get<UserAccountResource[]>(this.usersUrl);
  }

  findByEmail(email: string): Observable<UserAccountResource[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<UserAccountResource[]>(this.usersUrl, { params });
  }
}
