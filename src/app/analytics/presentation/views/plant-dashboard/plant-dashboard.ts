import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { Asset, AssetStatus } from '../../../../asset-management/domain/model/asset.entity';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { MaintenancePlanStore } from '../../../../maintenance-planning/application/maintenance-plan.store';
import { FailureStore } from '../../../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { LanguageService } from '../../../../shared/application/language.service';
import { daysUntil, hoursBetween, todayDate } from '../../../../shared/domain/model/date-time';
import { BoardLegend } from '../../../../shared/presentation/components/board-legend/board-legend';
import { DayStrip } from '../../../../shared/presentation/components/day-strip/day-strip';
import { Icon, IconName } from '../../../../shared/presentation/components/icon/icon';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenanceAnalytics } from '../../../application/maintenance-analytics';
import { PlantTimeline } from '../../../application/plant-timeline';
import { DayCell } from '../../../domain/model/day-timeline';

type Tone = 'down' | 'warn';

/** One thing the plant manager has to decide, with the action that settles it. */
interface Decision {
  key: string;
  tone: Tone;
  icon: IconName;
  code: string;
  name: string;
  reasonKey: string;
  reasonParams: Record<string, string | number>;
  actionKey: string;
  link: unknown[];
  query: Record<string, string> | null;
  /** 0 stopped machine, 1 report waiting on the manager, 2 late order, 3 late preventive. */
  rank: number;
  /** Higher sorts first inside its rank. */
  weight: number;
}

interface MachineRow {
  asset: Asset;
  cells: DayCell[];
  stoppedHours: number;
}

const STATUS_RANK: Record<AssetStatus, number> = { down: 0, maintenance: 1, operational: 2 };
const QUEUE_LIMIT = 6;

/**
 * Plant manager home as the daily management board: the morning-meeting
 * indicators with their last 14 days, what needs a decision now, and every
 * machine's two weeks at a glance.
 */
@Component({
  selector: 'app-plant-dashboard',
  imports: [RouterLink, TranslatePipe, Icon, BoardLegend, DayStrip, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plant-dashboard.html',
  styleUrl: './plant-dashboard.css',
})
export class PlantDashboard {
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  private readonly assetStore = inject(AssetStore);
  private readonly failureStore = inject(FailureStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly timeline = inject(PlantTimeline);
  private readonly language = inject(LanguageService);
  private readonly directory = inject(UserDirectoryStore);
  private readonly translate = inject(TranslateService);

  protected readonly today = todayDate();
  protected readonly plant = computed(() => this.plantStore.find(this.scope.currentPlantId()));
  protected readonly summary = this.analytics.current;
  protected readonly strips = this.timeline.current;
  protected readonly loading = computed(() => this.assetStore.state() !== 'ready' || this.failureStore.state() !== 'ready');

  protected readonly operational = computed(() => this.summary().assets - this.summary().down - this.summary().inMaintenance);

  /** How long the longest current stop has lasted, as of now. */
  protected readonly longestStop = computed(() =>
    this.assetStore
      .inScope()
      .filter((asset) => asset.status === 'down')
      .reduce((max, asset) => Math.max(max, hoursBetween(asset.statusChangedAt)), 0),
  );

  protected readonly unassignedOrders = computed(
    () => this.workOrderStore.inScope().filter((order) => order.isOpen && order.technicianId === null).length,
  );

  /** Weekday initials over the strips, so every column of the board names its day. */
  protected readonly dayHeads = computed(() => {
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    return this.timeline.days().map((date) => ({ date, letter: format.format(new Date(`${date}T00:00:00`)) }));
  });

  protected readonly machines = computed<MachineRow[]>(() =>
    [...this.assetStore.inScope()]
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.code.localeCompare(b.code))
      .map((asset) => ({
        asset,
        cells: this.timeline.forAsset(asset),
        stoppedHours: asset.status === 'down' ? hoursBetween(asset.statusChangedAt) : 0,
      })),
  );

  protected readonly decisions = computed<Decision[]>(() => {
    const decisions: Decision[] = [];
    const listed = new Set<string>();
    const orders = this.workOrderStore.inScope();
    const techName = (id: string | null) => this.directory.find(id)?.fullName ?? this.translate.instant('workOrders.unassigned');

    for (const failure of this.failureStore.pending()) {
      const asset = this.assetStore.find(failure.assetId);
      const base = { code: asset?.code ?? '—', name: asset?.name ?? '' };
      const stopped = asset?.status === 'down' || failure.lineStopped;
      const hours = Math.round(hoursBetween(asset?.status === 'down' ? asset.statusChangedAt : failure.reportedAt));
      const order = orders.find((candidate) => candidate.id === failure.workOrderId && candidate.isOpen);
      if (order) listed.add(order.id);

      if (failure.needsWorkOrder) {
        const actionable = failure.priority !== null || failure.lineStopped;
        decisions.push({
          ...base,
          key: `failure-${failure.id}`,
          tone: stopped ? 'down' : 'warn',
          icon: 'alert',
          reasonKey: failure.lineStopped ? 'board.reason.stoppedNoOrder' : failure.priority ? 'board.reason.noOrder' : 'board.reason.noPriority',
          reasonParams: { hours },
          actionKey: actionable ? 'board.action.createOrder' : 'board.action.prioritize',
          link: actionable ? ['/work-orders/new'] : ['/failures', failure.id],
          query: actionable ? { failureId: failure.id } : null,
          rank: stopped ? 0 : 1,
          weight: hours,
        });
        continue;
      }
      if (!order) continue;

      const late = order.isOverdue(this.today);
      if (order.technicianId === null || late || stopped) {
        const due = this.shortDate(order.dueDate);
        const reasonKey =
          order.technicianId === null
            ? 'board.reason.unassigned'
            : stopped
              ? late
                ? 'board.reason.stoppedLate'
                : 'board.reason.stoppedOnTrack'
              : 'board.reason.orderLate';
        decisions.push({
          ...base,
          key: `order-${order.id}`,
          tone: stopped ? 'down' : 'warn',
          icon: order.technicianId === null ? 'users' : 'clipboard',
          reasonKey,
          reasonParams: { hours, order: order.code, tech: techName(order.technicianId), due },
          actionKey: order.technicianId === null ? 'board.action.assign' : 'board.action.review',
          link: ['/work-orders', order.id],
          query: null,
          rank: stopped ? 0 : 2,
          weight: hours,
        });
      }
    }

    for (const order of orders) {
      if (listed.has(order.id) || !order.isOverdue(this.today)) continue;
      const asset = this.assetStore.find(order.assetId);
      const late = -daysUntil(order.dueDate, this.today);
      decisions.push({
        key: `late-${order.id}`,
        tone: 'warn',
        icon: 'clock',
        code: order.code,
        name: asset ? `${asset.code} · ${asset.name}` : order.title,
        reasonKey: order.technicianId ? 'board.reason.lateOrder' : 'board.reason.lateUnassigned',
        reasonParams: { days: late, tech: techName(order.technicianId) },
        actionKey: order.technicianId ? 'board.action.review' : 'board.action.assign',
        link: ['/work-orders', order.id],
        query: null,
        rank: 2,
        weight: late * 24,
      });
    }

    for (const plan of this.planStore.inScope()) {
      if (!plan.isOverdue(this.today)) continue;
      const asset = this.assetStore.find(plan.assetId);
      const late = -daysUntil(plan.nextDueDate, this.today);
      decisions.push({
        key: `plan-${plan.id}`,
        tone: 'warn',
        icon: 'calendar',
        code: asset?.code ?? '—',
        name: plan.title,
        reasonKey: 'board.reason.planOverdue',
        reasonParams: { days: late },
        actionKey: 'board.action.createOrder',
        link: ['/work-orders/new'],
        query: { planId: plan.id },
        rank: 3,
        weight: late * 24,
      });
    }

    // Stopped machines, then reports waiting on the manager, then late orders, then late preventives.
    return decisions.sort((a, b) => a.rank - b.rank || b.weight - a.weight);
  });

  protected readonly visibleDecisions = computed(() => this.decisions().slice(0, QUEUE_LIMIT));

  protected readonly agenda = computed(() =>
    this.planStore
      .inScope()
      .filter((plan) => plan.active && !plan.isOverdue(this.today) && daysUntil(plan.nextDueDate, this.today) <= 7)
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
      .slice(0, 5),
  );

  private shortDate(date: string): string {
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`));
  }

  protected assetCode(id: string): string {
    return this.assetStore.find(id)?.code ?? '';
  }

  protected percent(value: number | null): string {
    return value === null ? '—' : `${value}`;
  }
}
