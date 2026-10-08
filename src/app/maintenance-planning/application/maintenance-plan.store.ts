import { Injectable, computed, inject } from '@angular/core';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { CollectionStore } from '../../shared/application/collection.store';
import { nowIso, todayDate } from '../../shared/domain/model/date-time';
import { MaintenancePlan, MaintenancePlanDetails } from '../domain/model/maintenance-plan.entity';
import { MaintenancePlansApi } from '../infrastructure/maintenance-plans-api';

@Injectable({ providedIn: 'root' })
export class MaintenancePlanStore extends CollectionStore<MaintenancePlan> {
  protected readonly api = inject(MaintenancePlansApi);
  private readonly scope = inject(PlantScope);

  readonly inScope = computed(() =>
    this.items()
      .filter((plan) => this.scope.includes(plan.plantId))
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
  );

  readonly overdue = computed(() => {
    const today = todayDate();
    return this.inScope().filter((plan) => plan.isOverdue(today));
  });

  async schedule(plantId: string, details: MaintenancePlanDetails): Promise<MaintenancePlan> {
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
