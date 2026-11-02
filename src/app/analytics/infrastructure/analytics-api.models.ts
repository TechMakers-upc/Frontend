import type { MaintenanceSummary } from '../application/maintenance-analytics';
import type { TechnicianPerformance } from '../domain/model/maintenance-metrics';

export interface DowntimeEntryResource {
  readonly assetId: number;
  readonly hours: number;
}

export interface TechnicianPerformanceResource {
  readonly technicianId: number;
  readonly assigned: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly overdue: number;
  readonly avgRepairHours: number | null;
  readonly lastActivity: string | null;
}

export type MaintenanceSummaryResource = MaintenanceSummary;

export function toTechnicianPerformance(resource: TechnicianPerformanceResource): TechnicianPerformance {
  return { ...resource, technicianId: String(resource.technicianId) };
}

export function toDowntimeEntry(resource: DowntimeEntryResource): { assetId: string; hours: number } {
  return { assetId: String(resource.assetId), hours: resource.hours };
}
