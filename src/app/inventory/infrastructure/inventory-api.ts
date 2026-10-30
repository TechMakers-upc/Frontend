import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { SparePart, SparePartProps } from '../domain/model/spare-part.entity';
import { StockMovement, StockMovementProps } from '../domain/model/stock-movement.entity';
import { SparePartApiMapper, StockMovementApiMapper } from './inventory-api.mapper';
import { SparePartApiResource, StockMovementApiResource } from './inventory-api.models';

@Injectable({ providedIn: 'root' })
export class SparePartsApi extends BaseApi<SparePart, SparePartProps> {
  protected readonly endpointPath = environment.sparePartsEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: SparePartProps): SparePart {
    return new SparePart(resource);
  }

  override create(entity: SparePart): Observable<SparePart> {
    if (!this.tokenStorage.read()) {
      return this.http.post<SparePartProps>(
        '/demo-api/spare-parts',
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<SparePartApiResource>(
      this.url,
      SparePartApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  createWithInitialStock(
    entity: SparePart,
    initialStock: number,
  ): Observable<SparePart> {
    if (!this.tokenStorage.read()) {
      return this.create(entity);
    }

    return this.http.post<SparePartApiResource>(
      this.url,
      SparePartApiMapper.toSaveRequest(entity, initialStock),
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  override update(entity: SparePart): Observable<SparePart> {
    if (!this.tokenStorage.read()) {
      return this.http.put<SparePartProps>(
        `/demo-api/spare-parts/${entity.id}`,
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.put<SparePartApiResource>(
      `${this.url}/${entity.id}`,
      SparePartApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  override getAll(): Observable<SparePart[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<SparePartProps[]>('/demo-api/spare-parts').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<SparePartApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => SparePartApiMapper.toEntity(item))),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class StockMovementsApi extends BaseApi<StockMovement, StockMovementProps> {
  protected readonly endpointPath = environment.stockMovementsEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: StockMovementProps): StockMovement {
    return new StockMovement(resource);
  }

  override create(entity: StockMovement): Observable<StockMovement> {
    if (this.tokenStorage.read()) {
      throw new Error('Backend stock movements are created through stock operations');
    }

    return this.http.post<StockMovementProps>(
      '/demo-api/stock-movements',
      { ...entity },
    ).pipe(
      map((resource) => this.toEntity(resource)),
    );
  }

  override getAll(): Observable<StockMovement[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<StockMovementProps[]>('/demo-api/stock-movements').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<StockMovementApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => StockMovementApiMapper.toEntity(item))),
    );
  }
}
