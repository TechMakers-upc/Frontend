import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert } from '../domain/model/alert';

@Injectable({ providedIn: 'root' })
export class AlertsApi {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${environment.apiBaseUrl}/alerts`);
  }
}
