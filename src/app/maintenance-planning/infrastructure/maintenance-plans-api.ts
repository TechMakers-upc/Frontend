import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MaintenancePlan, MaintenancePlanProps } from '../domain/model/maintenance-plan.entity';

@Injectable({ providedIn: 'root' })
export class MaintenancePlansApi extends BaseApi<MaintenancePlan, MaintenancePlanProps> {
  protected readonly endpointPath = environment.maintenancePlansEndpointPath;

  protected toEntity(resource: MaintenancePlanProps): MaintenancePlan {
    return new MaintenancePlan(resource);
  }
}
