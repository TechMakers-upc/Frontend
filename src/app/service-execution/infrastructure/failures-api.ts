import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Failure, FailureProps } from '../domain/model/failure.entity';
import { Priority } from '../domain/model/priority';
import { FailureApiMapper } from './failure-api.mapper';
import { FailureApiResource } from './failure-api.models';

@Injectable({ providedIn: 'root' })
export class FailuresApi extends BaseApi<Failure, FailureProps> {
  protected readonly endpointPath = environment.failuresEndpointPath;


  protected toEntity(resource: FailureProps): Failure {
    return new Failure(resource);
  }

  override getAll(): Observable<Failure[]> {


    return this.http.get<FailureApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => FailureApiMapper.toEntity(item))),
    );
  }

  resolveFailure(failure: Failure): Observable<Failure> {


    return this.http.post<FailureApiResource>(
      `${this.url}/${failure.id}/resolution`,
      {},
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }

  prioritize(failure: Failure, priority: Priority): Observable<Failure> {


    return this.http.patch<FailureApiResource>(
      `${this.url}/${failure.id}/priority`,
      { priority },
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }

  override create(entity: Failure): Observable<Failure> {


    return this.http.post<FailureApiResource>(
      this.url,
      FailureApiMapper.toReportRequest(entity),
    ).pipe(
      map((resource) => FailureApiMapper.toEntity(resource)),
    );
  }
}
