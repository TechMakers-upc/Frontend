import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { MaintenanceSummary, Period } from '../application/maintenance-analytics';
import type { TechnicianPerformance } from '../domain/model/maintenance-metrics';
import {
  DowntimeEntryResource,
  MaintenanceSummaryResource,
  TechnicianPerformanceResource,
  toDowntimeEntry,
  toTechnicianPerformance,
} from './analytics-api.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/analytics`;

  private params(plantId: string | null, period: Period): HttpParams {
    let params = new HttpParams();
    if (plantId) params = params.set('plantId', plantId);
    if (period.from) params = params.set('from', period.from);
    if (period.to) params = params.set('to', period.to);
    return params;
  }

  getSummary(plantId: string | null = null, period: Period = { from: null, to: null }): Observable<MaintenanceSummary> {
    return this.http.get<MaintenanceSummaryResource>(`${this.url}/summary`, {
      params: this.params(plantId, period),
    });
  }

  getDowntimeRanking(plantId: string | null = null, period: Period = { from: null, to: null }): Observable<{ assetId: string; hours: number }[]> {
    return this.http.get<DowntimeEntryResource[]>(`${this.url}/downtime-ranking`, {
      params: this.params(plantId, period),
    }).pipe(map((rows) => rows.map(toDowntimeEntry)));
  }

  getTechnicianPerformance(technicianId: string, period: Period = { from: null, to: null }): Observable<TechnicianPerformance> {
    return this.http.get<TechnicianPerformanceResource>(
      `${this.url}/technicians/${encodeURIComponent(technicianId)}/performance`,
      { params: this.params(null, period) },
    ).pipe(map(toTechnicianPerformance));
  }
}
