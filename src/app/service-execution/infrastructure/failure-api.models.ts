export interface FailureApiResource {
  readonly id: number;
  readonly plantId: number;
  readonly assetId: number;
  readonly kind: string;
  readonly description: string;
  readonly lineStopped: boolean;
  readonly priority: string | null;
  readonly status: string;
  readonly reportedBy: number;
  readonly reportedAt: string;
  readonly resolvedAt: string | null;
  readonly workOrderId: number | null;
  readonly downtimeHours: number;
  readonly needsWorkOrder: boolean;
}

export interface ReportFailureRequest {
  readonly assetId: number;
  readonly kind: string;
  readonly description: string;
  readonly lineStopped: boolean;
}

export interface PrioritizeFailureRequest {
  readonly priority: string;
}
