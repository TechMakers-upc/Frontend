import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { Plant, PlantProps } from '../domain/model/plant.entity';
import { PlantApiResource } from './plant-api.models';
import { PlantApiMapper } from './plant-api.mapper';

@Injectable({ providedIn: 'root' })
export class PlantsApi extends BaseApi<Plant, PlantProps> {
  protected readonly endpointPath = environment.plantsEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: PlantProps): Plant {
    return new Plant({ ...resource, address: resource.address ?? '' });
  }

  override getAll(): Observable<Plant[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<PlantProps[]>('/demo-api/plants').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<PlantApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => PlantApiMapper.toEntity(item))),
    );
  }

  override create(entity: Plant): Observable<Plant> {
    if (!this.tokenStorage.read()) {
      return this.http.post<PlantProps>('/demo-api/plants', { ...entity }).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<PlantApiResource>(
      this.url,
      PlantApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => PlantApiMapper.toEntity(resource)),
    );
  }

  override update(entity: Plant): Observable<Plant> {
    if (!this.tokenStorage.read()) {
      return this.http.put<PlantProps>(
        `/demo-api/plants/${entity.id}`,
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.put<PlantApiResource>(
      `${this.url}/${entity.id}`,
      PlantApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => PlantApiMapper.toEntity(resource)),
    );
  }
}
