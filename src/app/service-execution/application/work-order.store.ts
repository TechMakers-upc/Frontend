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

  private assertAccessible(order: WorkOrder): void {
    if (!this.scope.includes(order.plantId)) {
      throw new Error('Work order is outside the selected plant');
    }
  }

  /** Orders assigned to the signed-in technician (US27). */
  readonly mine = computed(() => {
    const id = this.session.currentAccount()?.id;
    return this.inScope().filter((order) => order.technicianId === id);
  });

  async remove(id: string): Promise<void> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    this.assertAccessible(current);

    if (current.status !== 'pending' || current.failureId !== null) {
      throw new Error('Only pending work orders without a failure can be deleted');
    }

    await firstValueFrom(this.api.delete(id));

    this.itemsSignal.update((items) =>
      items.filter((item) => item.id !== id),
    );
  }

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

    this.assertAccessible(current);

    if (!Number.isSafeInteger(quantity) || quantity <= 0 ||
        current.status !== 'in-progress' ||
        current.technicianId !== this.session.currentAccount()?.id) {
      throw new Error('Part usage is not permitted');
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

    this.assertAccessible(current);

    if (current.status !== 'in-progress' ||
        current.technicianId !== this.session.currentAccount()?.id ||
        authorId !== this.session.currentAccount()?.id ||
        !note.trim()) {
      throw new Error('Work log is not permitted');
    }

    const saved = await firstValueFrom(
      this.api.logWork(current, note, authorId, at),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async completeOrder(
    id: string,
    solution: string,
    at: string,
  ): Promise<WorkOrder> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown work order ${id}`);
    }

    this.assertAccessible(current);

    if (current.status !== 'in-progress' ||
        current.technicianId !== this.session.currentAccount()?.id ||
        !solution.trim()) {
      throw new Error('Order completion is not permitted');
    }

    const saved = await firstValueFrom(
      this.api.completeOrder(current, solution, at),
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

    this.assertAccessible(current);

    if (current.status !== 'pending' ||
        current.technicianId !== this.session.currentAccount()?.id) {
      throw new Error('Order start is not permitted');
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

    this.assertAccessible(current);

    if (this.session.role() === 'technician' || !current.isOpen) {
      throw new Error('Order assignment is not permitted');
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
