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
