import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { AssetStore } from '../../asset-management/application/asset.store';
import { CollectionStore } from '../../shared/application/collection.store';
import { nowIso, todayDate } from '../../shared/domain/model/date-time';
import { MaintenancePlan, MaintenancePlanDetails } from '../domain/model/maintenance-plan.entity';
import { MaintenancePlansApi } from '../infrastructure/maintenance-plans-api';

@Injectable({ providedIn: 'root' })
export class MaintenancePlanStore extends CollectionStore<MaintenancePlan> {
  protected readonly api = inject(MaintenancePlansApi);
  private readonly scope = inject(PlantScope);
  private readonly assets = inject(AssetStore);

  private assertAccessible(plan: MaintenancePlan): void {
    if (!this.scope.includes(plan.plantId)) {
      throw new Error('Maintenance plan is outside the selected plant');
    }
  }

  readonly inScope = computed(() =>
    this.items()
      .filter((plan) => this.scope.includes(plan.plantId))
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
  );

  readonly overdue = computed(() => {
    const today = todayDate();
    return this.inScope().filter((plan) => plan.isOverdue(today));
  });

  async suspend(id: string): Promise<MaintenancePlan> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown maintenance plan ${id}`);
    }

    this.assertAccessible(current);

    const saved = await firstValueFrom(
      this.api.suspendPlan(current),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => item.id === saved.id ? saved : item),
    );

    return saved;
  }

  async reactivate(id: string): Promise<MaintenancePlan> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown maintenance plan ${id}`);
    }

    this.assertAccessible(current);

    const saved = await firstValueFrom(
      this.api.reactivatePlan(current),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => item.id === saved.id ? saved : item),
    );

    return saved;
  }

  async reschedule(
    id: string,
    nextDueDate: string,
  ): Promise<MaintenancePlan> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown maintenance plan ${id}`);
    }

    this.assertAccessible(current);

    const saved = await firstValueFrom(
      this.api.reschedulePlan(current, nextDueDate),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => item.id === saved.id ? saved : item),
    );

    return saved;
  }

async complete(id: string, completedOn: string): Promise<MaintenancePlan> {
  const current = this.find(id);
  if (!current) throw new Error(`Unknown maintenance plan ${id}`);
  this.assertAccessible(current);
  if (current.lastCompletedAt?.slice(0, 10) === completedOn) {
    throw new Error('This date has already been registered');
  }
  const saved = await firstValueFrom(this.api.registerCompletion(current, completedOn));
  this.itemsSignal.update((items) =>
    items.map((item) => item.id === saved.id ? saved : item),
  );
  return saved;
}

  async remove(id: string): Promise<void> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown maintenance plan ${id}`);
    this.assertAccessible(current);

    await firstValueFrom(this.api.delete(id));

    this.itemsSignal.update((items) =>
      items.filter((plan) => plan.id !== id),
    );
  }

  async schedule(plantId: string, details: MaintenancePlanDetails): Promise<MaintenancePlan> {
    const asset = this.assets.find(details.assetId);

    if (!this.scope.includes(plantId) || !asset || asset.plantId !== plantId) {
      throw new Error('Invalid plant or machine for maintenance plan');
    }

    const plan = new MaintenancePlan({
      id: crypto.randomUUID(),
      plantId,
      lastCompletedAt: null,
      active: true,
      createdAt: nowIso(),
      ...details,
    });
    plan.updateDetails(details);
    return this.add(plan);
  }
}
