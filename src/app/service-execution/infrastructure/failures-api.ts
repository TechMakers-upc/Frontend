import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { Failure, FailureProps } from '../domain/model/failure.entity';
import { FailureApiMapper } from './failure-api.mapper';
import { FailureApiResource } from './failure-api.models';

@Injectable({ providedIn: 'root' })
export class FailuresApi extends BaseApi<Failure, FailureProps> {
  protected readonly endpointPath = environment.failuresEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: FailureProps): Failure {
    return new Failure(resource);
  }

  override getAll(): Observable<Failure[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<FailureProps[]>('/demo-api/failures').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<FailureApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => FailureApiMapper.toEntity(item))),
    );
  }
}
