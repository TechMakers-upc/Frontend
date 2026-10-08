import { Injectable, computed, inject } from '@angular/core';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { SessionStore } from '../../shared/application/session.store';
import { CollectionStore } from '../../shared/application/collection.store';
import { priorityRank } from '../domain/model/priority';
import { WorkOrder } from '../domain/model/work-order.entity';
import { WorkOrdersApi } from '../infrastructure/work-orders-api';

@Injectable({ providedIn: 'root' })
export class WorkOrderStore extends CollectionStore<WorkOrder> {
  protected readonly api = inject(WorkOrdersApi);
  private readonly scope = inject(PlantScope);
  private readonly session = inject(SessionStore);

  readonly inScope = computed(() =>
    this.items()
      .filter((order) => this.scope.includes(order.plantId))
      .sort(
        (a, b) =>
          Number(!a.isOpen) - Number(!b.isOpen) ||
          priorityRank(a.priority) - priorityRank(b.priority) ||
          a.dueDate.localeCompare(b.dueDate),
      ),
  );

  /** Orders assigned to the signed-in technician (US27). */
  readonly mine = computed(() => {
    const id = this.session.currentAccount()?.id;
    return this.inScope().filter((order) => order.technicianId === id);
  });

  /** Codes follow OT-<year>-<sequence>, numbered per year. */
  nextCode(): string {
    const year = new Date().getFullYear();
    const prefix = `OT-${year}-`;
    const highest = this.items()
      .filter((order) => order.code.startsWith(prefix))
      .reduce((max, order) => Math.max(max, Number(order.code.slice(prefix.length)) || 0), 0);
    return `${prefix}${String(highest + 1).padStart(4, '0')}`;
  }
}
