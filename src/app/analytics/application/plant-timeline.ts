import { Injectable, computed, inject } from '@angular/core';

import { AssetStore } from '../../asset-management/application/asset.store';
import { PlantScope } from '../../asset-management/application/plant-scope';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { InventoryStore, StockMovementStore } from '../../inventory/application/inventory.store';
import { MaintenancePlanStore } from '../../maintenance-planning/application/maintenance-plan.store';
import { FailureStore } from '../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../service-execution/application/work-order.store';
import { todayDate } from '../../shared/domain/model/date-time';
import {
  DayCell,
  assetDay,
  failureDay,
  lastDays,
  stockDay,
  workOrderDay,
  worstOf,
} from '../domain/model/day-timeline';

/** The board shows two weeks: long enough to see a pattern, short enough to read in one glance. */
export const BOARD_DAYS = 14;

export interface PlantStrips {
  availability: DayCell[];
  failures: DayCell[];
  workOrders: DayCell[];
  stock: DayCell[];
}

/** Day-by-day read model behind the daily management board. */
@Injectable({ providedIn: 'root' })
export class PlantTimeline {
  private readonly scope = inject(PlantScope);
  private readonly assets = inject(AssetStore);
  private readonly failures = inject(FailureStore);
  private readonly orders = inject(WorkOrderStore);
  private readonly plans = inject(MaintenancePlanStore);
  private readonly parts = inject(InventoryStore);
  private readonly movements = inject(StockMovementStore);

  readonly days = computed(() => lastDays(todayDate(), BOARD_DAYS));

  /** Strips for the plants in scope. */
  readonly current = computed(() => this.forPlants(this.scope.plantIds()));

  forPlants(plantIds: string[]): PlantStrips {
    const days = this.days();
    const inPlants = <T extends { plantId: string }>(items: T[]) => items.filter((item) => plantIds.includes(item.plantId));
    const assets = inPlants(this.assets.items());
    const failures = inPlants(this.failures.items());
    const orders = inPlants(this.orders.items());
    const plans = inPlants(this.plans.items());
    const parts = inPlants(this.parts.items());
    const movements = inPlants(this.movements.items());

    return {
      availability: days.map((date) => ({
        date,
        state: worstOf(assets.map((asset) => assetDay(asset, date, failures, orders, plans))),
      })),
      failures: days.map((date) => ({ date, state: failureDay(date, failures) })),
      workOrders: days.map((date) => ({ date, state: workOrderDay(date, orders) })),
      stock: days.map((date) => ({ date, state: stockDay(date, parts, movements) })),
    };
  }

  forAsset(asset: Asset): DayCell[] {
    const failures = this.failures.items().filter((failure) => failure.assetId === asset.id);
    const orders = this.orders.items().filter((order) => order.assetId === asset.id);
    const plans = this.plans.items().filter((plan) => plan.assetId === asset.id);
    return this.days().map((date) => ({ date, state: assetDay(asset, date, failures, orders, plans) }));
  }
}
