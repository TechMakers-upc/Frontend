import { MaintenancePlan } from '../domain/model/maintenance-plan.entity';
import {
  MaintenancePlanApiResource,
  SaveMaintenancePlanRequest,
} from './maintenance-plan-api.models';

export class MaintenancePlanApiMapper {
  static toEntity(resource: MaintenancePlanApiResource): MaintenancePlan {
    return new MaintenancePlan({
      id: String(resource.id),
      plantId: String(resource.plantId),
      assetId: String(resource.assetId),
      title: resource.title,
      tasks: resource.tasks ?? '',
      frequencyDays: resource.frequencyDays,
      nextDueDate: resource.nextDueDate,
      lastCompletedAt: resource.lastCompletedAt,
      active: resource.active,
      technicianId:
        resource.technicianId === null
          ? null
          : String(resource.technicianId),
      createdAt: null,
    });
  }

  static toSaveRequest(plan: MaintenancePlan): SaveMaintenancePlanRequest {
    return {
      assetId: this.requiredId(plan.assetId),
      title: plan.title,
      tasks: plan.tasks,
      frequencyDays: plan.frequencyDays,
      nextDueDate: plan.nextDueDate,
      technicianId:
        plan.technicianId === null
          ? null
          : this.requiredId(plan.technicianId),
    };
  }

  private static requiredId(value: string): number {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend ID is required');
    }

    return id;
  }
}
