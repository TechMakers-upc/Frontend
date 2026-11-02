import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertsApi } from './alerts-api';

describe('AlertsApi', () => {
  let api: AlertsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AlertsApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('requests current user alerts from Spring Boot', async () => {
    const result = firstValueFrom(api.getAll());
    const request = http.expectOne(`${environment.apiBaseUrl}/alerts`);
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 'a-1', kind: 'low-stock', severity: 'warn',
      params: { part: 'Filter', stock: 2, min: 4 }, link: '/inventory/2', at: '2026-11-02T00:00:00Z',
    }]);
    const alerts = await result;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe('low-stock');
  });

  it('propagates an unauthorized response', async () => {
    const result = firstValueFrom(api.getAll());
    const rejected = expect(result).rejects.toMatchObject({ status: 401 });
    const request = http.expectOne(`${environment.apiBaseUrl}/alerts`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    await rejected;
  });
});
