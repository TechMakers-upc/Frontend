import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderType,
} from '../domain/model/work-order.entity';
import { Priority } from '../domain/model/priority';
import {
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  WorkOrderApiResource,
} from './work-order-api.models';

export class WorkOrderApiMapper {
  static toEntity(resource: WorkOrderApiResource): WorkOrder {
    return new WorkOrder({
      id: String(resource.id),
      code: resource.code,
      type: resource.type as WorkOrderType,
      plantId: String(resource.plantId),
      assetId: String(resource.assetId),
      failureId: this.toStringId(resource.failureId),
      planId: this.toStringId(resource.planId),
      title: resource.title,
      description: resource.description ?? '',
      priority: resource.priority as Priority,
      status: resource.status as WorkOrderStatus,
      technicianId: this.toStringId(resource.technicianId),
      dueDate: resource.dueDate,
      createdAt: resource.createdAt,
      createdBy: String(resource.createdBy),
      startedAt: resource.startedAt,
      completedAt: resource.completedAt,
      solution: resource.solution,
      workLog: (resource.workLog ?? []).map((entry) => ({
        at: entry.at,
        authorId: String(entry.authorId),
        note: entry.note,
      })),
      partsUsed: (resource.partsUsed ?? []).map((entry) => ({
        partId: String(entry.partId),
        quantity: entry.quantity,
        at: entry.at,
      })),
    });
  }

  static toCreateRequest(order: WorkOrder): CreateWorkOrderRequest {
    return {
      type: order.type,
      assetId: this.requiredId(order.assetId),
      title: order.title,
      description: order.description,
      priority: order.priority,
      dueDate: order.dueDate,
      technicianId: this.optionalId(order.technicianId),
      failureId: this.optionalId(order.failureId),
      planId: this.optionalId(order.planId),
    };
  }

  static toUpdateRequest(order: WorkOrder): UpdateWorkOrderRequest {
    return {
      title: order.title,
      description: order.description,
      priority: order.priority,
      dueDate: order.dueDate,
    };
  }

  private static toStringId(value: number | null): string | null {
    return value == null ? null : String(value);
  }

  private static optionalId(value: string | null): number | null {
    return value == null ? null : this.requiredId(value);
  }

  private static requiredId(value: string): number {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend ID is required');
    }

    return id;
  }
}
