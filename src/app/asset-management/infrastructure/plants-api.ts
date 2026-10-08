import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Plant, PlantProps } from '../domain/model/plant.entity';

@Injectable({ providedIn: 'root' })
export class PlantsApi extends BaseApi<Plant, PlantProps> {
  protected readonly endpointPath = environment.plantsEndpointPath;

  protected toEntity(resource: PlantProps): Plant {
    return new Plant({ ...resource, address: resource.address ?? '' });
  }
}
