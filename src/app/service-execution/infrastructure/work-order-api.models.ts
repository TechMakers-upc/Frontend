export interface WorkOrderApiResource {
  readonly id: number;
  readonly code: string;
  readonly type: string;
  readonly plantId: number;
  readonly assetId: number;
  readonly failureId: number | null;
  readonly planId: number | null;
  readonly title: string;
  readonly description: string;
  readonly priority: string;
  readonly status: string;
  readonly technicianId: number | null;
  readonly dueDate: string;
  readonly createdAt: string;
  readonly createdBy: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly solution: string | null;
  readonly workLog: {
    at: string;
    authorId: number;
    note: string;
  }[];
  readonly partsUsed: {
    partId: number;
    quantity: number;
    at: string;
  }[];
  readonly overdue: boolean;
  readonly repairHours: number | null;
}

export interface CreateWorkOrderRequest {
  readonly type: string;
  readonly assetId: number;
  readonly title: string;
  readonly description: string;
  readonly priority: string;
  readonly dueDate: string;
  readonly technicianId: number | null;
  readonly failureId: number | null;
  readonly planId: number | null;
}

export interface UpdateWorkOrderRequest {
  readonly title: string;
  readonly description: string;
  readonly priority: string;
  readonly dueDate: string;
}
