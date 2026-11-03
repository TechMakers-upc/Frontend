import { Injectable, inject } from '@angular/core';

import { AssetStore } from '../../asset-management/application/asset.store';
import { SessionStore } from '../../shared/application/session.store';
import { InventoryStore } from '../../inventory/application/inventory.store';
import { MaintenancePlanStore } from '../../maintenance-planning/application/maintenance-plan.store';
import { nowIso } from '../../shared/domain/model/date-time';
import { Failure, FailureKind } from '../domain/model/failure.entity';
import { Priority } from '../domain/model/priority';
import { WorkOrder, WorkOrderType } from '../domain/model/work-order.entity';
import { FailureStore } from './failure.store';
import { WorkOrderStore } from './work-order.store';

export interface NewWorkOrder {
  type: WorkOrderType;
  assetId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  technicianId: string | null;
  failureId: string | null;
  planId: string | null;
}

/**
 * Coordinates the steps of a maintenance job that touch several aggregates:
 * the asset status, the failure, the work order, the preventive plan and
 * the spare-part stock.
 */
@Injectable({ providedIn: 'root' })
export class MaintenanceExecutionService {
  private readonly session = inject(SessionStore);
  private readonly assets = inject(AssetStore);
  private readonly failures = inject(FailureStore);
  private readonly workOrders = inject(WorkOrderStore);
  private readonly plans = inject(MaintenancePlanStore);
  private readonly inventory = inject(InventoryStore);

  private get userId(): string {
    return this.session.currentAccount()?.id ?? '';
  }

  /** US19: a stopped line puts the machine in Falla right away. */
  async reportFailure(input: {
    assetId: string;
    kind: FailureKind;
    description: string;
    lineStopped: boolean;
  }): Promise<Failure> {
    const asset = this.assets.find(input.assetId);
    if (!asset) throw new Error('Unknown asset');
    const failure = await this.failures.add(
      Failure.report({ ...input, plantId: asset.plantId, reportedBy: this.userId }),
    );
    if (input.lineStopped) {
      // Spring Boot updates the asset in the same backend workflow.
      this.assets.load(true);
    }
    return failure;
  }

  /** US23 / US24 / US25: create an order, optionally from a failure or a preventive plan. */
  async createWorkOrder(input: NewWorkOrder): Promise<WorkOrder> {
    const asset = this.assets.find(input.assetId);
    if (!asset) throw new Error('Unknown asset');
    const order = new WorkOrder({
      id: crypto.randomUUID(),
      code: this.workOrders.nextCode(),
      type: input.type,
      plantId: asset.plantId,
      assetId: asset.id,
      failureId: input.failureId,
      planId: input.planId,
      title: '',
      description: '',
      priority: input.priority,
      status: 'pending',
      technicianId: input.technicianId,
      dueDate: input.dueDate,
      createdAt: nowIso(),
      createdBy: this.userId,
      startedAt: null,
      completedAt: null,
      solution: null,
      workLog: [],
      partsUsed: [],
    });
    order.updateDetails(input);
    const created = await this.workOrders.add(order);
    if (input.failureId) {
      this.failures.load(true);
    }
    return created;
  }

  /** US28: the repair clock starts and the machine shows as in maintenance. */
  async start(workOrderId: string): Promise<WorkOrder> {
    const at = nowIso();
    const order = await this.workOrders.startOrder(workOrderId, at);

    // Backend updates the equipment status when execution starts.
    this.assets.load(true);

    return order;
  }

  /** US38 / US39: the part leaves the warehouse and is recorded on the order. */
  async useParts(workOrderId: string, partId: string, quantity: number): Promise<WorkOrder> {
    const order = this.workOrders.find(workOrderId);
    if (!order) throw new Error('Unknown work order');

    const at = nowIso();
    const check = order.clone();
    check.registerPartUsage(partId, quantity, at);

    const saved = await this.workOrders.addPartUsage(workOrderId, partId, quantity, at);
    this.inventory.load(true);
    return saved;
  }

  /** US30: closing the order resolves its failure, frees the machine and rolls the plan forward. */
  async complete(workOrderId: string, solution: string): Promise<WorkOrder> {
    const order = await this.workOrders.completeOrder(
      workOrderId,
      solution,
      nowIso(),
    );

    if (order.failureId) this.failures.load(true);
    if (order.planId) this.plans.load(true);

    this.assets.load(true);
    return order;
  }
}
