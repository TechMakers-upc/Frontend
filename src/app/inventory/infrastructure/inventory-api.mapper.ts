import {
  PartCategory,
  PartUnit,
  SparePart,
} from '../domain/model/spare-part.entity';
import {
  MovementType,
  StockMovement,
} from '../domain/model/stock-movement.entity';
import {
  SaveSparePartRequest,
  SparePartApiResource,
  StockMovementApiResource,
} from './inventory-api.models';

export class SparePartApiMapper {
  static toEntity(resource: SparePartApiResource): SparePart {
    return new SparePart({
      id: String(resource.id),
      plantId: String(resource.plantId),
      sku: resource.sku,
      name: resource.name,
      category: resource.category as PartCategory,
      unit: resource.unit as PartUnit,
      stock: resource.stock,
      minStock: resource.minStock,
      location: resource.location ?? '',
    });
  }

  static toSaveRequest(
    part: SparePart,
    initialStock: number | null = null,
  ): SaveSparePartRequest {
    const plantId = Number(part.plantId);

    if (!Number.isSafeInteger(plantId) || plantId <= 0) {
      throw new Error('A valid backend plant ID is required');
    }

    if (
      initialStock !== null &&
      (!Number.isSafeInteger(initialStock) || initialStock < 0)
    ) {
      throw new Error('Initial stock must be a non-negative integer');
    }

    return {
      plantId,
      sku: part.sku,
      name: part.name,
      category: part.category,
      unit: part.unit,
      minStock: part.minStock,
      location: part.location,
      initialStock,
    };
  }
}

export class StockMovementApiMapper {
  static toEntity(resource: StockMovementApiResource): StockMovement {
    return new StockMovement({
      id: String(resource.id),
      plantId: String(resource.plantId),
      partId: String(resource.partId),
      type: resource.type as MovementType,
      quantity: resource.quantity,
      stockAfter: resource.stockAfter,
      reason: resource.reason ?? '',
      at: resource.at,
      userId: String(resource.userId),
      workOrderId:
        resource.workOrderId === null
          ? null
          : String(resource.workOrderId),
    });
  }
}
