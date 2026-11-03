import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { SessionStore } from '../../shared/application/session.store';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { CollectionStore } from '../../shared/application/collection.store';
import { nowIso } from '../../shared/domain/model/date-time';
import { SparePart, SparePartDetails } from '../domain/model/spare-part.entity';
import { MovementType, StockMovement } from '../domain/model/stock-movement.entity';
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
  private readonly session = inject(SessionStore);
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly movements = inject(StockMovementStore);

  readonly inScope = computed(() =>
    this.items()
      .filter((part) => this.scope.includes(part.plantId))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly belowMinimum = computed(() => this.inScope().filter((part) => part.isBelowMinimum));

  async register(plantId: string, details: SparePartDetails, initialStock: number): Promise<SparePart> {
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

    if (!current) {
      throw new Error(`Unknown spare part ${id}`);
    }

    await firstValueFrom(this.api.delete(id));

    this.itemsSignal.update((items) =>
      items.filter((item) => item.id !== id),
    );
  }

  receive(partId: string, quantity: number, reason: string): Promise<SparePart> {
    if (this.tokenStorage.read()) {
      return this.applyBackendStockOperation(
        this.api.receiveStock(partId, quantity, reason),
      );
    }

    return this.applyMovement(partId, 'entry', reason, null, (part) => {
      part.receive(quantity);
      return quantity;
    });
  }

  adjust(partId: string, counted: number, reason: string): Promise<SparePart> {
    if (this.tokenStorage.read()) {
      return this.applyBackendStockOperation(
        this.api.adjustStock(partId, counted, reason),
      );
    }

    return this.applyMovement(partId, 'adjustment', reason, null, (part) => part.adjustTo(counted));
  }

  consume(partId: string, quantity: number, workOrderId: string | null, reason: string): Promise<SparePart> {
    if (this.tokenStorage.read()) {
      return this.applyBackendStockOperation(
        this.api.consumeStock(partId, quantity, workOrderId, reason),
      );
    }

    return this.applyMovement(partId, 'consumption', reason, workOrderId, (part) => {
      part.consume(quantity);
      return -quantity;
    });
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

  private async applyMovement(
    partId: string,
    type: MovementType,
    reason: string,
    workOrderId: string | null,
    mutate: (draft: SparePart) => number,
  ): Promise<SparePart> {
    let delta = 0;
    const saved = await this.change(partId, (draft) => {
      delta = mutate(draft);
    });
    await this.movements.add(
      new StockMovement({
        id: crypto.randomUUID(),
        plantId: saved.plantId,
        partId,
        type,
        quantity: delta,
        stockAfter: saved.stock,
        reason,
        at: nowIso(),
        userId: this.session.currentAccount()?.id ?? '',
        workOrderId,
      }),
    );
    return saved;
  }
}
