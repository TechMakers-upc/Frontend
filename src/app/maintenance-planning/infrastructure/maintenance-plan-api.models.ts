export interface MaintenancePlanApiResource {
  readonly id: number;
  readonly plantId: number;
  readonly assetId: number;
  readonly title: string;
  readonly tasks: string;
  readonly frequencyDays: number;
  readonly nextDueDate: string;
  readonly lastCompletedAt: string | null;
  readonly active: boolean;
  readonly technicianId: number | null;
  readonly standing: string;
}

export interface SaveMaintenancePlanRequest {
  readonly assetId: number;
  readonly title: string;
  readonly tasks: string;
  readonly frequencyDays: number;
  readonly nextDueDate: string;
  readonly technicianId: number | null;
}

export interface RescheduleMaintenancePlanRequest {
  readonly nextDueDate: string;
}

export interface RegisterPlanCompletionRequest {
  readonly completedOn: string;
}
