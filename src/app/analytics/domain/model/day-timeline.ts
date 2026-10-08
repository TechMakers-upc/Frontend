import { Asset } from '../../../asset-management/domain/model/asset.entity';
import { StockMovement } from '../../../inventory/domain/model/stock-movement.entity';
import { SparePart } from '../../../inventory/domain/model/spare-part.entity';
import { MaintenancePlan } from '../../../maintenance-planning/domain/model/maintenance-plan.entity';
import { Failure } from '../../../service-execution/domain/model/failure.entity';
import { WorkOrder } from '../../../service-execution/domain/model/work-order.entity';
import { addDays, localDay } from '../../../shared/domain/model/date-time';
import { DayCell, DayState } from '../../../shared/domain/model/day-state';

export type { DayCell, DayState };

/** The last `count` calendar days, oldest first, ending on `today`. */
export function lastDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index - count + 1));
}

/** True when an interval that started on `start` and ended on `end` (open if null) touches `day`. */
function spans(day: string, start: string, end: string | null): boolean {
  return localDay(start) <= day && (end === null || localDay(end) >= day);
}

/** A machine's day: stopped by a failure, in maintenance, or running. */
export function assetDay(
  asset: Asset,
  day: string,
  failures: Failure[],
  orders: WorkOrder[],
  plans: MaintenancePlan[],
): DayState {
  if (asset.installedAt && localDay(asset.installedAt) > day) return 'none';
  const stopped = failures.some(
    (failure) => failure.assetId === asset.id && failure.lineStopped && spans(day, failure.reportedAt, failure.resolvedAt),
  );
  if (stopped) {
    const planOverdue = plans.some((plan) => plan.assetId === asset.id && plan.active && plan.nextDueDate < day);
    return planOverdue ? 'conflict' : 'down';
  }
  const inMaintenance =
    orders.some((order) => order.assetId === asset.id && order.startedAt !== null && spans(day, order.startedAt, order.completedAt)) ||
    failures.some((failure) => failure.assetId === asset.id && !failure.lineStopped && spans(day, failure.reportedAt, failure.resolvedAt));
  return inMaintenance ? 'warn' : 'ok';
}

/** Worst state across machines; conflict and down outrank warn. */
export function worstOf(states: DayState[]): DayState {
  if (states.includes('conflict')) return 'conflict';
  if (states.includes('down')) return 'down';
  if (states.includes('warn')) return 'warn';
  return states.includes('ok') ? 'ok' : 'none';
}

/** Failures reported that day: a stopped line paints red, any other report amber. */
export function failureDay(day: string, failures: Failure[]): DayState {
  const reported = failures.filter((failure) => localDay(failure.reportedAt) === day);
  if (reported.some((failure) => failure.lineStopped)) return 'down';
  return reported.length > 0 ? 'warn' : 'ok';
}

/** Open work orders that day: any already past due paints red, otherwise amber while some are open. */
export function workOrderDay(day: string, orders: WorkOrder[]): DayState {
  const open = orders.filter((order) => spans(day, order.createdAt, order.completedAt) && !(order.completedAt && localDay(order.completedAt) === day && localDay(order.createdAt) !== day));
  if (open.some((order) => order.dueDate < day)) return 'down';
  return open.length > 0 ? 'warn' : 'ok';
}

/** Units on hand at the end of `day`, rebuilt from the movement log. */
export function stockOn(part: SparePart, day: string, movements: StockMovement[]): number {
  const own = movements.filter((movement) => movement.partId === part.id).sort((a, b) => a.at.localeCompare(b.at));
  const until = own.filter((movement) => localDay(movement.at) <= day);
  if (until.length > 0) return until[until.length - 1]!.stockAfter;
  const first = own[0];
  return first ? first.stockAfter - first.quantity : part.stock;
}

/** Spare parts that day: any part out of stock paints red, any at or under its minimum amber. */
export function stockDay(day: string, parts: SparePart[], movements: StockMovement[]): DayState {
  if (parts.length === 0) return 'none';
  const levels = parts.map((part) => ({ stock: stockOn(part, day, movements), min: part.minStock }));
  if (levels.some((level) => level.stock <= 0)) return 'down';
  return levels.some((level) => level.stock <= level.min) ? 'warn' : 'ok';
}

/** Counts per state, for the strip's spoken summary. */
export function tally(cells: DayCell[]): Record<DayState, number> {
  const counts: Record<DayState, number> = { ok: 0, warn: 0, down: 0, conflict: 0, none: 0 };
  for (const cell of cells) counts[cell.state]++;
  return counts;
}
