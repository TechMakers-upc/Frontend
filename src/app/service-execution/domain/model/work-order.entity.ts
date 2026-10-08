import { hoursBetween, todayDate } from '../../../shared/domain/model/date-time';
import { Entity } from '../../../shared/domain/model/entity';
import { Priority } from './priority';

export const WORK_ORDER_TYPES = ['corrective', 'preventive'] as const;
export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number];

export const WORK_ORDER_STATUSES = ['pending', 'in-progress', 'completed'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export interface WorkLogEntry {
  at: string;
  authorId: string;
  note: string;
}

export interface PartUsage {
  partId: string;
  quantity: number;
  at: string;
}

export interface WorkOrderProps {
  id: string;
  code: string;
  type: WorkOrderType;
  plantId: string;
  assetId: string;
  failureId: string | null;
  planId: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: WorkOrderStatus;
  technicianId: string | null;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  startedAt: string | null;
  completedAt: string | null;
  solution: string | null;
  workLog: WorkLogEntry[];
  partsUsed: PartUsage[];
}

export type WorkOrderDetails = Pick<WorkOrderProps, 'title' | 'description' | 'priority' | 'dueDate' | 'assetId'>;

/** Orden de Trabajo (OT): one maintenance task assigned to a technician. */
export interface WorkOrder extends WorkOrderProps {}

export class WorkOrder extends Entity {
  constructor(props: WorkOrderProps) {
    super();
    Object.assign(this, props);
  }

  get isOpen(): boolean {
    return this.status !== 'completed';
  }

  isOverdue(today: string = todayDate()): boolean {
    return this.isOpen && this.dueDate < today;
  }

  /** Hours from start to close: the input for MTTR. */
  repairHours(): number | null {
    return this.startedAt && this.completedAt ? hoursBetween(this.startedAt, this.completedAt) : null;
  }

  updateDetails(details: WorkOrderDetails): void {
    if (!this.isOpen) throw new Error('Completed work orders are read-only');
    if (!details.title.trim()) throw new Error('A work order needs a title');
    Object.assign(this, details, { title: details.title.trim(), description: details.description.trim() });
  }

  assign(technicianId: string): void {
    if (!this.isOpen) throw new Error('Completed work orders cannot be reassigned');
    this.technicianId = technicianId;
  }

  start(at: string): void {
    if (this.status !== 'pending') throw new Error('Only pending work orders can start');
    if (!this.technicianId) throw new Error('Assign a technician first');
    this.status = 'in-progress';
    this.startedAt = at;
  }

  logWork(note: string, authorId: string, at: string): void {
    if (this.status !== 'in-progress') throw new Error('Work can only be logged while the order is in progress');
    if (!note.trim()) throw new Error('Empty note');
    this.workLog = [...this.workLog, { at, authorId, note: note.trim() }];
  }

  registerPartUsage(partId: string, quantity: number, at: string): void {
    if (this.status !== 'in-progress') throw new Error('Parts can only be logged while the order is in progress');
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantity must be a positive integer');
    this.partsUsed = [...this.partsUsed, { partId, quantity, at }];
  }

  complete(solution: string, at: string): void {
    if (this.status !== 'in-progress') throw new Error('Start the work order before closing it');
    if (!solution.trim()) throw new Error('Describe the work done');
    this.status = 'completed';
    this.completedAt = at;
    this.solution = solution.trim();
  }
}
