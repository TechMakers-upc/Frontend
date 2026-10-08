import { Injectable, computed, inject } from '@angular/core';

import { AssetStore } from '../../asset-management/application/asset.store';
import { PlantScope } from '../../asset-management/application/plant-scope';
import { UserDirectoryStore } from '../../shared/application/user-directory.store';
import { InventoryStore } from '../../inventory/application/inventory.store';
import { MaintenancePlanStore } from '../../maintenance-planning/application/maintenance-plan.store';
import { FailureStore } from '../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../service-execution/application/work-order.store';
import { isWithin, todayDate } from '../../shared/domain/model/date-time';
import {
  StatusCounts,
  TechnicianPerformance,
  availability,
  downtimeByAsset,
  downtimeHours,
  mttrHours,
  preventiveCompliance,
  statusCounts,
  technicianPerformance,
} from '../domain/model/maintenance-metrics';

export interface MaintenanceSummary {
  assets: number;
  down: number;
  inMaintenance: number;
  availability: number | null;
  orders: StatusCounts;
  openOrders: number;
  criticalOpenOrders: number;
  overdueOrders: number;
  pendingFailures: number;
  criticalFailures: number;
  downtimeHours: number;
  mttrHours: number | null;
  compliance: number | null;
  overduePlans: number;
  lowStock: number;
  technicians: number;
}

export interface Period {
  from: string | null;
  to: string | null;
}

/** Read model for dashboards and reports (Panel y Reportes context). */
@Injectable({ providedIn: 'root' })
export class MaintenanceAnalytics {
  private readonly scope = inject(PlantScope);
  private readonly assets = inject(AssetStore);
  private readonly failures = inject(FailureStore);
  private readonly workOrders = inject(WorkOrderStore);
  private readonly plans = inject(MaintenancePlanStore);
  private readonly inventory = inject(InventoryStore);
  private readonly directory = inject(UserDirectoryStore);

  readonly current = computed(() => this.summarize(this.scope.plantIds()));

  readonly downtimeRanking = computed(() => this.rankDowntime(this.scope.plantIds()));

  summarize(plantIds: string[], period: Period = { from: null, to: null }): MaintenanceSummary {
    const inPlants = (plantId: string) => plantIds.includes(plantId);
    const today = todayDate();
    const assets = this.assets.items().filter((a) => inPlants(a.plantId));
    const failures = this.failures
      .items()
      .filter((f) => inPlants(f.plantId) && isWithin(f.reportedAt, period.from, period.to));
    const orders = this.workOrders
      .items()
      .filter((o) => inPlants(o.plantId) && isWithin(o.createdAt, period.from, period.to));
    const open = orders.filter((o) => o.isOpen);
    const pendingFailures = failures.filter((f) => !f.isResolved);

    return {
      assets: assets.length,
      down: assets.filter((a) => a.status === 'down').length,
      inMaintenance: assets.filter((a) => a.status === 'maintenance').length,
      availability: availability(assets),
      orders: statusCounts(orders),
      openOrders: open.length,
      criticalOpenOrders: open.filter((o) => o.priority === 'critical').length,
      overdueOrders: open.filter((o) => o.isOverdue(today)).length,
      pendingFailures: pendingFailures.length,
      criticalFailures: pendingFailures.filter((f) => f.priority === 'critical').length,
      downtimeHours: downtimeHours(failures),
      mttrHours: mttrHours(orders),
      compliance: preventiveCompliance(orders),
      overduePlans: this.plans.items().filter((p) => inPlants(p.plantId) && p.isOverdue(today)).length,
      lowStock: this.inventory.items().filter((p) => inPlants(p.plantId) && p.isBelowMinimum).length,
      technicians: this.directory
        .accounts()
        .filter((u) => u.role === 'technician' && u.plantId !== null && inPlants(u.plantId)).length,
    };
  }

  /** US42: machines that lose the most hours, highest first. */
  rankDowntime(plantIds: string[], period: Period = { from: null, to: null }): { assetId: string; hours: number }[] {
    const failures = this.failures
      .items()
      .filter((f) => plantIds.includes(f.plantId) && isWithin(f.reportedAt, period.from, period.to));
    return [...downtimeByAsset(failures)]
      .map(([assetId, hours]) => ({ assetId, hours }))
      .sort((a, b) => b.hours - a.hours);
  }

  technicianPerformance(technicianId: string, period: Period = { from: null, to: null }): TechnicianPerformance {
    const orders = this.workOrders.items().filter((o) => isWithin(o.createdAt, period.from, period.to));
    return technicianPerformance(technicianId, orders, todayDate());
  }
}
