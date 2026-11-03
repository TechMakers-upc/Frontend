import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Plant, PlantProps } from '../domain/model/plant.entity';
import { PlantApiResource } from './plant-api.models';
import { PlantApiMapper } from './plant-api.mapper';

@Injectable({ providedIn: 'root' })
export class PlantsApi extends BaseApi<Plant, PlantProps> {
  protected readonly endpointPath = environment.plantsEndpointPath;


  protected toEntity(resource: PlantProps): Plant {
    return new Plant({ ...resource, address: resource.address ?? '' });
  }

  override getAll(): Observable<Plant[]> {


    return this.http.get<PlantApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => PlantApiMapper.toEntity(item))),
    );
  }

  override create(entity: Plant): Observable<Plant> {


    return this.http.post<PlantApiResource>(
      this.url,
      PlantApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => PlantApiMapper.toEntity(resource)),
    );
  }

  override update(entity: Plant): Observable<Plant> {


    return this.http.put<PlantApiResource>(
      `${this.url}/${entity.id}`,
      PlantApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => PlantApiMapper.toEntity(resource)),
    );
  }

  override delete(id: string): Observable<void> {


    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
