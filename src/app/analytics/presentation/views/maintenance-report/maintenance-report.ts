import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { InventoryStore, StockMovementStore } from '../../../../inventory/application/inventory.store';
import { FailureStore } from '../../../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { addDays, isWithin, nowIso, todayDate } from '../../../../shared/domain/model/date-time';
import { BrandMark } from '../../../../shared/presentation/components/brand-mark/brand-mark';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenanceAnalytics, Period } from '../../../application/maintenance-analytics';

/** US47: a per-plant (per-client) maintenance report, printable and exportable. */
@Component({
  selector: 'app-maintenance-report',
  imports: [TranslatePipe, BrandMark, Icon, PageHeader, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-report.html',
  styleUrl: './maintenance-report.css',
})
export class MaintenanceReport {
  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly scope = inject(PlantScope);
  private readonly session = inject(SessionStore);
  private readonly assetStore = inject(AssetStore);
  private readonly failureStore = inject(FailureStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly movementStore = inject(StockMovementStore);
  private readonly inventory = inject(InventoryStore);
  private readonly translate = inject(TranslateService);
  protected readonly plantStore = inject(PlantStore);
  protected readonly directory = inject(UserDirectoryStore);

  protected readonly canPickPlant = computed(() => this.session.role() === 'operations-manager');
  protected readonly plantId = signal<string>('');
  protected readonly from = signal(addDays(todayDate(), -30));
  protected readonly to = signal(todayDate());
  protected readonly generatedAt = signal(nowIso());

  constructor() {
    effect(() => {
      const current = this.scope.currentPlantId() ?? this.plantStore.plants()[0]?.id ?? '';
      untracked(() => {
        if (!this.plantId() || !this.canPickPlant()) this.plantId.set(current);
      });
    });
  }

  private readonly period = computed<Period>(() => ({ from: this.from() || null, to: this.to() || null }));

  protected readonly plant = computed(() => this.plantStore.find(this.plantId()));
  protected readonly summary = computed(() => this.analytics.summarize([this.plantId()], this.period()));

  protected readonly orders = computed(() =>
    this.workOrderStore
      .items()
      .filter((o) => o.plantId === this.plantId() && isWithin(o.createdAt, this.period().from, this.period().to))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

  protected readonly failures = computed(() =>
    this.failureStore
      .items()
      .filter((f) => f.plantId === this.plantId() && isWithin(f.reportedAt, this.period().from, this.period().to))
      .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt)),
  );

  protected readonly downtime = computed(() =>
    this.analytics.rankDowntime([this.plantId()], this.period()).map((row) => ({ ...row, asset: this.assetStore.find(row.assetId) })),
  );

  protected readonly consumption = computed(() => {
    const totals = new Map<string, number>();
    for (const movement of this.movementStore.items()) {
      if (movement.plantId !== this.plantId() || movement.type !== 'consumption') continue;
      if (!isWithin(movement.at, this.period().from, this.period().to)) continue;
      totals.set(movement.partId, (totals.get(movement.partId) ?? 0) - movement.quantity);
    }
    return [...totals].map(([partId, quantity]) => ({ part: this.inventory.find(partId), quantity }));
  });

  protected assetLabel(id: string): string {
    const asset = this.assetStore.find(id);
    return asset ? `${asset.code} · ${asset.name}` : '—';
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected print(): void {
    this.generatedAt.set(nowIso());
    window.print();
  }

  /** Work orders of the period as CSV, ready for Excel. */
  protected downloadCsv(): void {
    const t = (key: string) => this.translate.instant(key);
    const header = [
      t('workOrders.order'),
      t('workOrders.type'),
      t('workOrders.machine'),
      t('workOrders.priority'),
      t('workOrders.status'),
      t('workOrders.technician'),
      t('workOrders.due'),
      t('workOrders.completed'),
      t('workOrders.repairTime'),
    ];
    const rows = this.orders().map((o) => [
      o.code,
      t(`workOrderType.${o.type}`),
      this.assetLabel(o.assetId),
      t(`priority.${o.priority}`),
      t(`workOrderStatus.${o.status}`),
      this.directory.find(o.technicianId)?.fullName ?? '',
      o.dueDate,
      o.completedAt?.slice(0, 16).replace('T', ' ') ?? '',
      o.repairHours()?.toFixed(1) ?? '',
    ]);
    const escape = (cell: string) => (/[",;\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fixcore-${this.plant()?.name.toLowerCase().replace(/\s+/g, '-') ?? 'plant'}-${this.from()}-${this.to()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
