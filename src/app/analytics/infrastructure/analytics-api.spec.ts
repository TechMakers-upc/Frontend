import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsApi } from './analytics-api';

describe('AnalyticsApi', () => {
  let api: AnalyticsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AnalyticsApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('filters summary by plant and dates', async () => {
    const result = firstValueFrom(api.getSummary('3', { from: '2026-10-01', to: '2026-10-31' }));
    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/analytics/summary`);
    expect(req.request.params.get('plantId')).toBe('3');
    expect(req.request.params.get('from')).toBe('2026-10-01');
    expect(req.request.params.get('to')).toBe('2026-10-31');
    req.flush({ assets: 1, down: 0, availability: 100 });
    expect((await result).assets).toBe(1);
  });

  it('converts ranking machine IDs to frontend strings', async () => {
    const result = firstValueFrom(api.getDowntimeRanking('2'));
    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/analytics/downtime-ranking`);
    expect(req.request.params.get('plantId')).toBe('2');
    req.flush([{ assetId: 25, hours: 4.5 }]);
    expect(await result).toEqual([{ assetId: '25', hours: 4.5 }]);
  });

  it('converts technician ID to a frontend string', async () => {
    const result = firstValueFrom(api.getTechnicianPerformance('7'));
    const req = http.expectOne(`${environment.apiBaseUrl}/analytics/technicians/7/performance`);
    req.flush({ technicianId: 7, assigned: 1, inProgress: 1, completed: 3, overdue: 0, avgRepairHours: 2, lastActivity: null });
    expect((await result).technicianId).toBe('7');
  });
});
