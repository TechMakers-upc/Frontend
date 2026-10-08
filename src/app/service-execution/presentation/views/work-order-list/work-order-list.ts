import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { todayDate } from '../../../../shared/domain/model/date-time';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { WorkOrderStore } from '../../../application/work-order.store';
import { PRIORITIES, Priority, priorityRank } from '../../../domain/model/priority';
import { WORK_ORDER_STATUSES, WORK_ORDER_TYPES, WorkOrder, WorkOrderStatus, WorkOrderType } from '../../../domain/model/work-order.entity';
import { WorkOrderCard } from '../../components/work-order-card/work-order-card';
import { PRIORITY_TONE, WORK_ORDER_STATUS_TONE } from '../../execution-presentation';

type SortKey = 'code' | 'machine' | 'priority' | 'status' | 'technician' | 'due';

@Component({
  selector: 'app-work-order-list',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, StatusBadge, WorkOrderCard, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './work-order-list.css',
  templateUrl: './work-order-list.html',
})
export class WorkOrderList {
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly session = inject(SessionStore);
  private readonly scope = inject(PlantScope);
  private readonly router = inject(Router);
  protected readonly directory = inject(UserDirectoryStore);

  readonly status = input<WorkOrderStatus | 'open' | undefined>();

  protected readonly statuses = WORK_ORDER_STATUSES;
  protected readonly priorities = PRIORITIES;
  protected readonly types = WORK_ORDER_TYPES;
  protected readonly statusTone = WORK_ORDER_STATUS_TONE;
  protected readonly priorityTone = PRIORITY_TONE;
  protected readonly today = todayDate();

  protected readonly isTechnician = computed(() => this.session.role() === 'technician');
  protected readonly canCreate = computed(() => !this.isTechnician());
  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected readonly query = signal('');
  protected readonly priority = signal<Priority | ''>('');
  protected readonly type = signal<WorkOrderType | ''>('');
  protected readonly technicianId = signal('');

  protected readonly columns: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: 'code', label: 'workOrders.order', sortable: true },
    { key: 'machine', label: 'workOrders.machine', sortable: true },
    { key: 'priority', label: 'workOrders.priority', sortable: true },
    { key: 'status', label: 'workOrders.status', sortable: true },
    { key: 'technician', label: 'workOrders.technician', sortable: false },
    { key: 'due', label: 'workOrders.due', sortable: true },
  ];
  /** Default: most urgent first, then the earliest due. */
  protected readonly sortKey = signal<SortKey>('priority');
  protected readonly sortDir = signal<1 | -1>(1);

  private readonly source = computed(() =>
    this.isTechnician() ? this.workOrderStore.mine() : this.workOrderStore.inScope(),
  );

  protected readonly counts = computed(() => {
    const counts: Record<WorkOrderStatus, number> = { pending: 0, 'in-progress': 0, completed: 0 };
    for (const order of this.source()) counts[order.status]++;
    return counts;
  });

  protected readonly visible = computed(() => {
    const status = this.status();
    const text = this.query().trim().toLowerCase();
    const priority = this.priority();
    const type = this.type();
    const technicianId = this.technicianId();
    return this.source().filter((order) => {
      if (status === 'open' ? !order.isOpen : status && order.status !== status) return false;
      if (priority && order.priority !== priority) return false;
      if (type && order.type !== type) return false;
      if (technicianId && (technicianId === 'none' ? order.technicianId !== null : order.technicianId !== technicianId)) return false;
      if (!text) return true;
      const asset = this.assetStore.find(order.assetId);
      return `${order.code} ${order.title} ${asset?.code ?? ''} ${asset?.name ?? ''}`.toLowerCase().includes(text);
    });
  });

  protected readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const statusRank: Record<WorkOrderStatus, number> = { pending: 0, 'in-progress': 1, completed: 2 };
    const value = (order: WorkOrder): string | number => {
      switch (key) {
        case 'code':
          return order.code;
        case 'machine':
          return this.assetStore.find(order.assetId)?.code ?? '';
        case 'priority':
          return priorityRank(order.priority);
        case 'status':
          return statusRank[order.status];
        default:
          return order.dueDate;
      }
    };
    return [...this.visible()].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const primary = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return primary * dir || a.dueDate.localeCompare(b.dueDate);
    });
  });

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 1 ? -1 : 1);
    } else {
      this.sortKey.set(key);
      this.sortDir.set(1);
    }
  }

  protected filterStatus(status: WorkOrderStatus | 'open' | null): void {
    void this.router.navigate([], { queryParams: { status }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected assetLabel(id: string): string {
    const asset = this.assetStore.find(id);
    return asset ? `${asset.code} · ${asset.name}` : '—';
  }

  protected plantName(id: string): string {
    return this.plantStore.find(id)?.displayName ?? '';
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
