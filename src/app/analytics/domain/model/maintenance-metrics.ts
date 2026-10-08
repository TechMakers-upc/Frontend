import { Asset } from '../../../asset-management/domain/model/asset.entity';
import { Failure } from '../../../service-execution/domain/model/failure.entity';
import { WorkOrder, WorkOrderStatus } from '../../../service-execution/domain/model/work-order.entity';
import { localDay, nowIso } from '../../../shared/domain/model/date-time';

export type StatusCounts = Record<WorkOrderStatus, number>;

/** US42: hours lost to stopped lines, open stoppages counted up to now. */
export function downtimeHours(failures: Failure[], now: string = nowIso()): number {
  return failures.reduce((total, failure) => total + failure.downtimeHours(now), 0);
}

export function downtimeByAsset(failures: Failure[], now: string = nowIso()): Map<string, number> {
  const totals = new Map<string, number>();
  for (const failure of failures) {
    const hours = failure.downtimeHours(now);
    if (hours > 0) totals.set(failure.assetId, (totals.get(failure.assetId) ?? 0) + hours);
  }
  return totals;
}

/** US43: mean time to repair over closed corrective orders. */
export function mttrHours(orders: WorkOrder[]): number | null {
  const durations = orders
    .filter((order) => order.type === 'corrective')
    .map((order) => order.repairHours())
    .filter((hours): hours is number => hours !== null);
  if (durations.length === 0) return null;
  return durations.reduce((sum, hours) => sum + hours, 0) / durations.length;
}

/** US44: share of closed preventive orders finished on or before their due date. */
export function preventiveCompliance(orders: WorkOrder[]): number | null {
  const closed = orders.filter((order) => order.type === 'preventive' && order.completedAt);
  if (closed.length === 0) return null;
  const onTime = closed.filter((order) => localDay(order.completedAt!) <= order.dueDate).length;
  return Math.round((onTime / closed.length) * 100);
}

/** US45 */
export function statusCounts(orders: WorkOrder[]): StatusCounts {
  const counts: StatusCounts = { pending: 0, 'in-progress': 0, completed: 0 };
  for (const order of orders) counts[order.status]++;
  return counts;
}

/** Share of machines currently running. */
export function availability(assets: Asset[]): number | null {
  if (assets.length === 0) return null;
  return Math.round((assets.filter((asset) => asset.status === 'operational').length / assets.length) * 100);
}

export interface TechnicianPerformance {
  technicianId: string;
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
  avgRepairHours: number | null;
  lastActivity: string | null;
}

/** US46 */
export function technicianPerformance(technicianId: string, orders: WorkOrder[], today: string): TechnicianPerformance {
  const own = orders.filter((order) => order.technicianId === technicianId);
  const repairs = own.map((order) => order.repairHours()).filter((hours): hours is number => hours !== null);
  const activity = own
    .flatMap((order) => [order.startedAt, order.completedAt, ...order.workLog.map((entry) => entry.at)])
    .filter((at): at is string => at !== null)
    .sort();
  return {
    technicianId,
    assigned: own.filter((order) => order.status === 'pending').length,
    inProgress: own.filter((order) => order.status === 'in-progress').length,
    completed: own.filter((order) => order.status === 'completed').length,
    overdue: own.filter((order) => order.isOverdue(today)).length,
    avgRepairHours: repairs.length ? repairs.reduce((a, b) => a + b, 0) / repairs.length : null,
    lastActivity: activity.at(-1) ?? null,
  };
}
