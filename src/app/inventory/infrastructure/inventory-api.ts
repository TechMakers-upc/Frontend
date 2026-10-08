import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SparePart, SparePartProps } from '../domain/model/spare-part.entity';
import { StockMovement, StockMovementProps } from '../domain/model/stock-movement.entity';

@Injectable({ providedIn: 'root' })
export class SparePartsApi extends BaseApi<SparePart, SparePartProps> {
  protected readonly endpointPath = environment.sparePartsEndpointPath;

  protected toEntity(resource: SparePartProps): SparePart {
    return new SparePart(resource);
  }
}

@Injectable({ providedIn: 'root' })
export class StockMovementsApi extends BaseApi<StockMovement, StockMovementProps> {
  protected readonly endpointPath = environment.stockMovementsEndpointPath;

  protected toEntity(resource: StockMovementProps): StockMovement {
    return new StockMovement(resource);
  }
}
