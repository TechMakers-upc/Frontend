import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Failure, FailureProps } from '../domain/model/failure.entity';

@Injectable({ providedIn: 'root' })
export class FailuresApi extends BaseApi<Failure, FailureProps> {
  protected readonly endpointPath = environment.failuresEndpointPath;

  protected toEntity(resource: FailureProps): Failure {
    return new Failure(resource);
  }
}
