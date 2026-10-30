import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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

  async addPartUsage(
    id: string,
    partId: string,
    quantity: number,
    at: string,
  ): Promise<WorkOrder> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    const saved = await firstValueFrom(
      this.api.registerPartUsage(current, partId, quantity, at),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async addWorkLog(
    id: string,
    note: string,
    authorId: string,
    at: string,
  ): Promise<WorkOrder> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    const saved = await firstValueFrom(
      this.api.logWork(current, note, authorId, at),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async startOrder(id: string, at: string): Promise<WorkOrder> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    const saved = await firstValueFrom(
      this.api.startOrder(current, at),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async assignTechnician(id: string, technicianId: string): Promise<WorkOrder> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    const saved = await firstValueFrom(
      this.api.assignTechnician(current, technicianId),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

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
