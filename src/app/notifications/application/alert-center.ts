import { Injectable, computed, inject, signal } from '@angular/core';

import { AssetStore } from '../../asset-management/application/asset.store';
import { SessionStore } from '../../shared/application/session.store';
import { InventoryStore } from '../../inventory/application/inventory.store';
import { MaintenancePlanStore } from '../../maintenance-planning/application/maintenance-plan.store';
import { FailureStore } from '../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../service-execution/application/work-order.store';
import { daysUntil, todayDate } from '../../shared/domain/model/date-time';
import { Alert } from '../domain/model/alert';

const SEEN_KEY = 'fixcore.alerts-seen';

/**
 * Alerts are derived from the current state (US48–US51). Delivery through
 * WhatsApp (US53) belongs to the notifications service on the backend.
 */
@Injectable({ providedIn: 'root' })
export class AlertCenter {
  private readonly session = inject(SessionStore);
  private readonly assets = inject(AssetStore);
  private readonly failures = inject(FailureStore);
  private readonly plans = inject(MaintenancePlanStore);
  private readonly workOrders = inject(WorkOrderStore);
  private readonly inventory = inject(InventoryStore);

  private readonly seenSignal = signal<Set<string>>(this.readSeen());

  readonly alerts = computed<Alert[]>(() => {
    const role = this.session.currentAccount()?.role;
    if (!role) return [];
    const today = todayDate();
    const assetName = (id: string) => this.assets.find(id)?.name ?? '';
    const alerts: Alert[] = [];

    if (role === 'technician') {
      for (const order of this.workOrders.mine().filter((o) => o.status === 'pending')) {
        alerts.push({
          id: `wo-${order.id}`,
          kind: 'work-order-assigned',
          severity: order.priority === 'critical' ? 'down' : 'info',
          params: { code: order.code, asset: assetName(order.assetId) },
          link: `/work-orders/${order.id}`,
          at: order.createdAt,
        });
      }
    }

    for (const failure of this.failures.pending().filter((f) => f.priority === 'critical')) {
      alerts.push({
        id: `failure-${failure.id}`,
        kind: 'critical-failure',
        severity: 'down',
        params: { asset: assetName(failure.assetId) },
        link: role === 'technician' ? `/assets/${failure.assetId}` : `/failures/${failure.id}`,
        at: failure.reportedAt,
      });
    }

    if (role !== 'technician') {
      for (const plan of this.plans.inScope()) {
        const standing = plan.standing(today);
        if (standing !== 'overdue' && standing !== 'due-soon') continue;
        alerts.push({
          id: `plan-${plan.id}-${plan.nextDueDate}`,
          kind: standing === 'overdue' ? 'maintenance-overdue' : 'maintenance-due',
          severity: standing === 'overdue' ? 'down' : 'warn',
          params: { title: plan.title, asset: assetName(plan.assetId), days: Math.abs(daysUntil(plan.nextDueDate, today)) },
          link: '/maintenance',
          at: `${plan.nextDueDate}T00:00:00`,
        });
      }

      for (const part of this.inventory.belowMinimum()) {
        alerts.push({
          id: `stock-${part.id}-${part.stock}`,
          kind: 'low-stock',
          severity: part.level === 'out' ? 'down' : 'warn',
          params: { part: part.name, stock: part.stock, min: part.minStock },
          link: `/inventory/${part.id}`,
          at: '',
        });
      }
    }

    const rank = { down: 0, warn: 1, info: 2 } as const;
    return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || b.at.localeCompare(a.at));
  });

  readonly unseenCount = computed(() => this.alerts().filter((alert) => !this.seenSignal().has(alert.id)).length);

  markAllSeen(): void {
    const ids = new Set(this.alerts().map((alert) => alert.id));
    this.seenSignal.set(ids);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
    } catch {
      // Not critical.
    }
  }

  isSeen(id: string): boolean {
    return this.seenSignal().has(id);
  }

  private readSeen(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
    } catch {
      return new Set();
    }
  }
}
