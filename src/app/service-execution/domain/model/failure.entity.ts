import { hoursBetween, nowIso } from '../../../shared/domain/model/date-time';
import { Entity } from '../../../shared/domain/model/entity';
import { Priority } from './priority';

export const FAILURE_KINDS = ['wont-start', 'noise', 'leak', 'jam', 'electrical', 'other'] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

export const FAILURE_STATUSES = ['open', 'in-progress', 'resolved'] as const;
export type FailureStatus = (typeof FAILURE_STATUSES)[number];

export interface FailureProps {
  id: string;
  plantId: string;
  assetId: string;
  kind: FailureKind;
  description: string;
  lineStopped: boolean;
  priority: Priority | null;
  status: FailureStatus;
  reportedBy: string;
  reportedAt: string;
  resolvedAt: string | null;
  workOrderId: string | null;
}

/** An unexpected event reported on an asset (Falla / Incidencia). */
export interface Failure extends FailureProps {}

export class Failure extends Entity {
  constructor(props: FailureProps) {
    super();
    Object.assign(this, props);
  }

  static report(input: {
    plantId: string;
    assetId: string;
    kind: FailureKind;
    description: string;
    lineStopped: boolean;
    reportedBy: string;
  }): Failure {
    return new Failure({
      id: crypto.randomUUID(),
      ...input,
      description: input.description.trim(),
      // A stopped line is critical by definition; the plant manager sets the rest.
      priority: input.lineStopped ? 'critical' : null,
      status: 'open',
      reportedAt: nowIso(),
      resolvedAt: null,
      workOrderId: null,
    });
  }

  get isResolved(): boolean {
    return this.status === 'resolved';
  }

  get needsWorkOrder(): boolean {
    return this.status === 'open' && this.workOrderId === null;
  }

  /** Downtime only counts while the line was actually stopped. */
  downtimeHours(now: string = nowIso()): number {
    if (!this.lineStopped) return 0;
    return hoursBetween(this.reportedAt, this.resolvedAt ?? now);
  }

  prioritize(priority: Priority): void {
    if (this.isResolved) throw new Error('Resolved failures cannot be re-prioritized');
    this.priority = priority;
  }

  attachWorkOrder(workOrderId: string): void {
    if (this.workOrderId) throw new Error('This failure already has a work order');
    this.workOrderId = workOrderId;
    this.status = 'in-progress';
  }

  resolve(at: string): void {
    this.status = 'resolved';
    this.resolvedAt = at;
  }
}
