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

  it('uses the demo API when there is no JWT', async () => {
    token = null;

    const result = firstValueFrom(api.delete('demo-12'));

    const request = http.expectOne(
      '/demo-api/maintenance-plans/demo-12',
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