import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { MaintenancePlan, MaintenancePlanProps } from '../domain/model/maintenance-plan.entity';
import { MaintenancePlanApiMapper } from './maintenance-plan-api.mapper';
import { MaintenancePlanApiResource } from './maintenance-plan-api.models';

@Injectable({ providedIn: 'root' })
export class MaintenancePlansApi extends BaseApi<MaintenancePlan, MaintenancePlanProps> {
  protected readonly endpointPath = environment.maintenancePlansEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: MaintenancePlanProps): MaintenancePlan {
    return new MaintenancePlan(resource);
  }

  override getAll(): Observable<MaintenancePlan[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<MaintenancePlanProps[]>('/demo-api/maintenance-plans').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<MaintenancePlanApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => MaintenancePlanApiMapper.toEntity(item))),
    );
  }
}
