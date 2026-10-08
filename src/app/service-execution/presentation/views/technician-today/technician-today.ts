import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { MaintenancePlanStore } from '../../../../maintenance-planning/application/maintenance-plan.store';
import { PlantTimeline } from '../../../../analytics/application/plant-timeline';
import { daysUntil, hoursBetween, localDay, todayDate } from '../../../../shared/domain/model/date-time';
import { DayStrip } from '../../../../shared/presentation/components/day-strip/day-strip';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { WorkOrderStore } from '../../../application/work-order.store';
import { WorkOrderStatus } from '../../../domain/model/work-order.entity';
import { WorkOrderCard } from '../../components/work-order-card/work-order-card';

const UPCOMING_DAYS = 14;

/** Wireflow 02: the technician's start screen on the plant floor. */
@Component({
  selector: 'app-technician-today',
  imports: [RouterLink, TranslatePipe, DayStrip, Icon, StatusBadge, WorkOrderCard, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './technician-today.html',
  styleUrl: './technician-today.css',
})
export class TechnicianToday {
  private readonly session = inject(SessionStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly assetStore = inject(AssetStore);
  private readonly timeline = inject(PlantTimeline);

  protected readonly account = this.session.currentAccount;
  protected readonly statusOptions: ('all' | Exclude<WorkOrderStatus, 'completed'>)[] = ['all', 'pending', 'in-progress'];
  /** Two separate facets: where the order is, and whether to see only the critical ones. */
  protected readonly status = signal<'all' | Exclude<WorkOrderStatus, 'completed'>>('all');
  protected readonly criticalOnly = signal(false);

  protected readonly open = computed(() => this.workOrderStore.mine().filter((order) => order.isOpen));
  protected readonly pendingCount = computed(() => this.open().filter((o) => o.status === 'pending').length);
  protected readonly runningCount = computed(() => this.open().filter((o) => o.status === 'in-progress').length);
  protected readonly doneThisWeek = computed(() => {
    const today = todayDate();
    return this.workOrderStore
      .mine()
      .filter((o) => o.completedAt && daysUntil(today, localDay(o.completedAt)) <= 7).length;
  });

  protected readonly visible = computed(() => {
    const status = this.status();
    return this.open().filter(
      (order) => (status === 'all' || order.status === status) && (!this.criticalOnly() || order.priority === 'critical'),
    );
  });

  protected countFor(option: 'all' | Exclude<WorkOrderStatus, 'completed'>): number {
    return option === 'all' ? this.open().length : this.open().filter((order) => order.status === option).length;
  }

  /** US16: preventive work coming up, mine first. */
  protected readonly upcoming = computed(() => {
    const me = this.account()?.id;
    const today = todayDate();
    return this.planStore
      .inScope()
      .filter((plan) => plan.active && daysUntil(plan.nextDueDate, today) <= UPCOMING_DAYS)
      .sort((a, b) => Number(b.technicianId === me) - Number(a.technicianId === me) || a.nextDueDate.localeCompare(b.nextDueDate))
      .slice(0, 6)
      .map((plan) => ({
        plan,
        asset: this.assetStore.find(plan.assetId),
        days: daysUntil(plan.nextDueDate, today),
        mine: plan.technicianId === me,
      }));
  });

  protected readonly stopped = computed(() =>
    this.assetStore
      .inScope()
      .filter((asset) => asset.status === 'down')
      .map((asset) => ({ asset, hours: hoursBetween(asset.statusChangedAt), cells: this.timeline.forAsset(asset) })),
  );
}
