import { addDays, daysUntil, todayDate } from '../../../shared/domain/model/date-time';
import { Entity } from '../../../shared/domain/model/entity';

export const FREQUENCY_PRESETS = [7, 15, 30, 60, 90, 180, 365] as const;

/** Plans due within this many days show up as upcoming. */
export const DUE_SOON_DAYS = 7;


export interface MaintenancePlanProps {
  id: string;
  plantId: string;
  assetId: string;
  title: string;
  tasks: string;
  frequencyDays: number;
  nextDueDate: string;
  lastCompletedAt: string | null;
  active: boolean;
  technicianId: string | null;
  createdAt: string;
}

export type MaintenancePlanDetails = Pick<
  MaintenancePlanProps,
  'assetId' | 'title' | 'tasks' | 'frequencyDays' | 'nextDueDate' | 'technicianId'
>;

export type PlanStanding = 'suspended' | 'overdue' | 'due-soon' | 'scheduled';

/** A recurring preventive maintenance for one asset. */
export interface MaintenancePlan extends MaintenancePlanProps {}

export class MaintenancePlan extends Entity {
  constructor(props: MaintenancePlanProps) {
    super();
    Object.assign(this, props);
  }

  standing(today: string = todayDate()): PlanStanding {
    if (!this.active) return 'suspended';
    const days = daysUntil(this.nextDueDate, today);
    if (days < 0) return 'overdue';
    if (days <= DUE_SOON_DAYS) return 'due-soon';
    return 'scheduled';
  }

  isOverdue(today: string = todayDate()): boolean {
    return this.standing(today) === 'overdue';
  }

  updateDetails(details: MaintenancePlanDetails): void {
    if (!details.title.trim() || !details.assetId) throw new Error('A plan needs an asset and a title');
    MaintenancePlan.assertFrequency(details.frequencyDays);
    Object.assign(this, details, { title: details.title.trim(), tasks: details.tasks.trim() });
  }

  reschedule(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
    this.nextDueDate = date;
  }

  suspend(): void {
    this.active = false;
  }

  reactivate(today: string = todayDate()): void {
    this.active = true;
    if (daysUntil(this.nextDueDate, today) < 0) this.nextDueDate = today;
  }

  /** Called when the preventive work order is closed: the next date rolls forward. */
  registerCompletion(completedOn: string): void {
    this.lastCompletedAt = completedOn;
    this.nextDueDate = addDays(completedOn, this.frequencyDays);
  }

  static assertFrequency(days: number): void {
    if (!Number.isInteger(days) || days < 1 || days > 730) throw new Error('Frequency must be 1 to 730 days');
  }
}
