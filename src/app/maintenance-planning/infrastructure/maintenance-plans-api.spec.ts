import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { MaintenancePlansApi } from './maintenance-plans-api';

describe('MaintenancePlansApi', () => {
  let api: MaintenancePlansApi;
  let http: HttpTestingController;
  let token: string | null;

  beforeEach(() => {
    token = 'test-token';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthTokenStorage,
          useValue: { read: () => token },
        },
      ],
    });

    api = TestBed.inject(MaintenancePlansApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

it('posts a completion to Spring Boot with the selected date', async () => {
  const plan = { id: '12' } as Parameters<MaintenancePlansApi['registerCompletion']>[0];
  const result = firstValueFrom(api.registerCompletion(plan, '2026-11-02'));
  const request = http.expectOne(`${environment.apiBaseUrl}/maintenance-plans/12/completions`);
  expect(request.request.method).toBe('POST');
  expect(request.request.body).toEqual({ completedOn: '2026-11-02' });
  request.flush({
    id: 12, plantId: 1, assetId: 2, title: 'Review', tasks: '',
    frequencyDays: 30, nextDueDate: '2026-12-02', lastCompletedAt: '2026-11-02',
    active: true, technicianId: null, standing: 'scheduled',
  });
  const saved = await result;
  expect(saved.nextDueDate).toBe('2026-12-02');
});

it('rejects an invalid completion date before sending HTTP', () => {
  const plan = { id: '12' } as Parameters<MaintenancePlansApi['registerCompletion']>[0];
  expect(() => api.registerCompletion(plan, 'invalid')).toThrow();
  http.expectNone(`${environment.apiBaseUrl}/maintenance-plans/12/completions`);
});

  it('deletes a plan through Spring Boot when authenticated', async () => {
    const result = firstValueFrom(api.delete('12'));

    const request = http.expectOne(
      `${environment.apiBaseUrl}/maintenance-plans/12`,
    );

    expect(request.request.method).toBe('DELETE');

    request.flush(null, {
      status: 204,
      statusText: 'No Content',
    });

    await result;
  });

  it('uses the backend API even when a JWT is missing', async () => {
    token = null;

    const result = firstValueFrom(api.delete('demo-12'));

    const request = http.expectOne(
      environment.apiBaseUrl + '/maintenance-plans/demo-12',
    );

    expect(request.request.method).toBe('DELETE');

    request.flush(null);

    await result;
  });

  it('returns backend errors without hiding them', async () => {
    const result = firstValueFrom(api.delete('15'));
    const rejection = expect(result).rejects.toMatchObject({
      status: 403,
    });

    const request = http.expectOne(
      `${environment.apiBaseUrl}/maintenance-plans/15`,
    );

    request.flush(
      { message: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );

    await rejection;
  });
});