import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { CollectionStore } from '../../shared/application/collection.store';
import { SparePart, SparePartDetails } from '../domain/model/spare-part.entity';
import { StockMovement } from '../domain/model/stock-movement.entity';
import { SparePartsApi, StockMovementsApi } from '../infrastructure/inventory-api';

@Injectable({ providedIn: 'root' })
export class StockMovementStore extends CollectionStore<StockMovement> {
  protected readonly api = inject(StockMovementsApi);

  forPart(partId: string): StockMovement[] {
    return this.items()
      .filter((movement) => movement.partId === partId)
      .sort((a, b) => b.at.localeCompare(a.at));
  }
}

@Injectable({ providedIn: 'root' })
export class InventoryStore extends CollectionStore<SparePart> {
  protected readonly api = inject(SparePartsApi);
  private readonly scope = inject(PlantScope);
  private readonly movements = inject(StockMovementStore);

  readonly inScope = computed(() =>
    this.items()
      .filter((part) => this.scope.includes(part.plantId))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly belowMinimum = computed(() => this.inScope().filter((part) => part.isBelowMinimum));

  private requirePartInScope(partId: string): void {
    const part = this.find(partId);

    if (!part || !this.scope.includes(part.plantId)) {
      throw new Error('Spare part is not accessible in the current plant');
    }
  }

  async register(plantId: string, details: SparePartDetails, initialStock: number): Promise<SparePart> {
    if (!this.scope.includes(plantId)) {
      throw new Error('Plant is not accessible');
    }

    if (!Number.isSafeInteger(initialStock) || initialStock < 0) {
      throw new Error('Initial stock must be a non-negative integer');
    }

    const part = new SparePart({
      id: crypto.randomUUID(),
      plantId,
      stock: 0,
      ...details,
    });

    part.updateDetails(details);

    const created = await firstValueFrom(
      this.api.createWithInitialStock(part, initialStock),
    );

    this.itemsSignal.update((items) => [...items, created]);

    if (initialStock > 0) {
      this.movements.load(true);
    }

    return created;
  }

  async remove(id: string): Promise<void> {
    const current = this.find(id);

    if (!current || !this.scope.includes(current.plantId)) {
      throw new Error('Spare part is not accessible');
    }

    if (current.stock > 0) {
      throw new Error('Spare part still has stock');
    }

    await firstValueFrom(this.api.delete(id));

    this.itemsSignal.update((items) =>
      items.filter((item) => item.id !== id),
    );
  }

  receive(partId: string, quantity: number, reason: string): Promise<SparePart> {
    this.requirePartInScope(partId);
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || !reason.trim()) {
      throw new Error('Invalid stock reception');
    }
    return this.applyBackendStockOperation(
      this.api.receiveStock(partId, quantity, reason),
    );
  }

  adjust(partId: string, counted: number, reason: string): Promise<SparePart> {
    this.requirePartInScope(partId);
    if (!Number.isSafeInteger(counted) || counted < 0 || !reason.trim()) {
      throw new Error('Invalid stock adjustment');
    }
    return this.applyBackendStockOperation(
      this.api.adjustStock(partId, counted, reason),
    );
  }

  consume(partId: string, quantity: number, workOrderId: string | null, reason: string): Promise<SparePart> {
    this.requirePartInScope(partId);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('Invalid stock consumption');
    }
    return this.applyBackendStockOperation(
      this.api.consumeStock(partId, quantity, workOrderId, reason),
    );
  }

  private async applyBackendStockOperation(
    operation: Observable<SparePart>,
  ): Promise<SparePart> {
    const saved = await firstValueFrom(operation);

    this.itemsSignal.update((items) =>
      items.map((item) => item.id === saved.id ? saved : item),
    );

    // Spring Boot already recorded the stock movement.
    this.movements.load(true);

    return saved;
  }


}
