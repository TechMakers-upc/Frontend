import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { Failure, FailureProps } from '../domain/model/failure.entity';
import { Priority } from '../domain/model/priority';
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

  resolveFailure(failure: Failure): Observable<Failure> {
    if (!this.tokenStorage.read()) {
      const draft = failure.clone();
      draft.resolve(new Date().toISOString());

      return this.http.put<FailureProps>(
        `/demo-api/failures/${failure.id}`,
        { ...draft },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<FailureApiResource>(
      `${this.url}/${failure.id}/resolution`,
      {},
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }

  prioritize(failure: Failure, priority: Priority): Observable<Failure> {
    if (!this.tokenStorage.read()) {
      const draft = failure.clone();
      draft.prioritize(priority);

      return this.http.put<FailureProps>(
        `/demo-api/failures/${failure.id}`,
        { ...draft },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.patch<FailureApiResource>(
      `${this.url}/${failure.id}/priority`,
      { priority },
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }

  override create(entity: Failure): Observable<Failure> {
    if (!this.tokenStorage.read()) {
      return this.http.post<FailureProps>(
        '/demo-api/failures',
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<FailureApiResource>(
      this.url,
      FailureApiMapper.toReportRequest(entity),
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }
}
