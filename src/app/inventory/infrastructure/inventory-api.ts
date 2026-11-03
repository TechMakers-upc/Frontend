import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { SparePart, SparePartProps } from '../domain/model/spare-part.entity';
import { StockMovement, StockMovementProps } from '../domain/model/stock-movement.entity';
import { SparePartApiMapper, StockMovementApiMapper } from './inventory-api.mapper';
import {
  AdjustStockRequest,
  ConsumeStockRequest,
  ReceiveStockRequest,
  SparePartApiResource,
  StockMovementApiResource,
} from './inventory-api.models';

@Injectable({ providedIn: 'root' })
export class SparePartsApi extends BaseApi<SparePart, SparePartProps> {
  protected readonly endpointPath = environment.sparePartsEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: SparePartProps): SparePart {
    return new SparePart(resource);
  }

  override create(entity: SparePart): Observable<SparePart> {


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


    return this.http.post<SparePartApiResource>(
      this.url,
      SparePartApiMapper.toSaveRequest(entity, initialStock),
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  override update(entity: SparePart): Observable<SparePart> {


    return this.http.put<SparePartApiResource>(
      `${this.url}/${entity.id}`,
      SparePartApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  receiveStock(
    partId: string,
    quantity: number,
    reason: string,
  ): Observable<SparePart> {
    const id = Number(partId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend spare part ID is required');
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive integer');
    }

    if (!this.tokenStorage.read()) {
      throw new Error('This operation requires backend authentication');
    }

    const request: ReceiveStockRequest = { quantity, reason };

    return this.http.post<SparePartApiResource>(
      `${this.url}/${id}/entries`,
      request,
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  adjustStock(
    partId: string,
    countedStock: number,
    reason: string,
  ): Observable<SparePart> {
    const id = Number(partId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend spare part ID is required');
    }

    if (!Number.isSafeInteger(countedStock) || countedStock < 0) {
      throw new Error('Stock must be a non-negative integer');
    }

    if (!this.tokenStorage.read()) {
      throw new Error('This operation requires backend authentication');
    }

    const request: AdjustStockRequest = { countedStock, reason };

    return this.http.post<SparePartApiResource>(
      `${this.url}/${id}/adjustments`,
      request,
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  consumeStock(
    partId: string,
    quantity: number,
    workOrderId: string | null,
    reason: string,
  ): Observable<SparePart> {
    if (!this.tokenStorage.read()) {
      throw new Error('This operation requires backend authentication');
    }

    const id = Number(partId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend spare part ID is required');
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive integer');
    }

    const orderId = workOrderId === null ? null : Number(workOrderId);

    if (
      orderId !== null &&
      (!Number.isSafeInteger(orderId) || orderId <= 0)
    ) {
      throw new Error('A valid backend work order ID is required');
    }

    const request: ConsumeStockRequest = {
      quantity,
      workOrderId: orderId,
      reason,
    };

    return this.http.post<SparePartApiResource>(
      `${this.url}/${id}/consumptions`,
      request,
    ).pipe(
      map((resource) => SparePartApiMapper.toEntity(resource)),
    );
  }

  override delete(id: string): Observable<void> {


    return this.http.delete<void>(`${this.url}/${id}`);
  }

  override getAll(): Observable<SparePart[]> {


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


    return this.http.get<StockMovementApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => StockMovementApiMapper.toEntity(item))),
    );
  }
}
