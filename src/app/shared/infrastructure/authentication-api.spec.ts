import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticationApi } from './authentication-api';

describe('AuthenticationApi', () => {
  let api: AuthenticationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AuthenticationApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends credentials to the real Spring Boot authentication endpoint', async () => {
    const result = firstValueFrom(api.signIn({ email: 'carla.garcia@fixcore.demo', password: 'test-password' }));
    const request = http.expectOne(`${environment.apiBaseUrl}/authentication/sign-in`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'carla.garcia@fixcore.demo', password: 'test-password' });
    request.flush({
      token: 'sample.jwt.value',
      account: { id: 1, fullName: 'Carla Garcia', email: 'carla.garcia@fixcore.demo',
        role: 'plant-manager', plantId: 1, jobTitle: 'Jefa de Planta' },
    });
    expect((await result).account.role).toBe('plant-manager');
  });

  it('preserves a 401 error for invalid credentials', async () => {
    const result = firstValueFrom(api.signIn({ email: 'bad@example.com', password: 'invalid-value' }));
    const rejected = expect(result).rejects.toMatchObject({ status: 401 });
    http.expectOne(`${environment.apiBaseUrl}/authentication/sign-in`)
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await rejected;
  });
});
