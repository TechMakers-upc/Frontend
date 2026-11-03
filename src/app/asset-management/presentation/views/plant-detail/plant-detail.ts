import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MaintenanceAnalytics } from '../../../../analytics/application/maintenance-analytics';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { FailureStore } from '../../../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { Dialog } from '../../../../shared/presentation/components/dialog/dialog';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { KpiCard } from '../../../../shared/presentation/components/kpi-card/kpi-card';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { AssetStore } from '../../../application/asset.store';
import { PlantScope } from '../../../application/plant-scope';
import { PlantStore } from '../../../application/plant.store';
import { ASSET_STATUS_TONE } from '../../asset-presentation';

@Component({
  selector: 'app-plant-detail',
  imports: [RouterLink, TranslatePipe, Dialog, Icon, KpiCard, PageHeader, StatusBadge, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './plant-detail.css',
  templateUrl: './plant-detail.html',
})
export class PlantDetail {
  private readonly plantStore = inject(PlantStore);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly assetStore = inject(AssetStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly failureStore = inject(FailureStore);
  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly scope = inject(PlantScope);
  protected readonly directory = inject(UserDirectoryStore);

  readonly id = input.required<string>();

  protected readonly statusTone = ASSET_STATUS_TONE;
  protected readonly plant = computed(() => this.plantStore.find(this.id()));
  protected readonly canEdit = computed(() =>
    this.sessionStore.role() === 'operations-manager' ||
    (this.sessionStore.role() === 'plant-manager' &&
      this.sessionStore.currentAccount()?.plantId === this.id()),
  );
  protected readonly canDelete = computed(() => this.sessionStore.role() === 'operations-manager');
  protected readonly confirmOpen = signal(false);
  protected readonly busy = signal(false);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly summary = computed(() => this.analytics.summarize([this.id()]));
  protected readonly assets = computed(() => this.assetStore.items().filter((a) => a.plantId === this.id()));
  protected readonly openOrders = computed(() =>
    this.workOrderStore.items().filter((o) => o.plantId === this.id() && o.isOpen),
  );
  protected readonly recentFailures = computed(() =>
    this.failureStore
      .items()
      .filter((f) => f.plantId === this.id())
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
      .slice(0, 6),
  );
  protected readonly technicians = computed(() =>
    this.directory.accounts().filter((u) => u.role === 'technician' && u.plantId === this.id()),
  );

  protected assetName(id: string): string {
    return this.assetStore.find(id)?.name ?? '';
  }

  protected focus(): void {
    this.scope.select(this.id());
  }

  protected requestDelete(): void {
    if (!this.canDelete() || !this.plant()) return;
    this.confirmOpen.set(true);
  }

  protected async deletePlant(): Promise<void> {
    if (!this.canDelete()) return;

    const plant = this.plant();
    if (!plant) return;

    this.confirmOpen.set(false);
    this.busy.set(true);

    try {
      await this.plantStore.remove(plant.id);
      this.toast.success(this.translate.instant('plants.deleted'));
      await this.router.navigateByUrl('/plants');
    } catch {
      this.toast.error(this.translate.instant('plants.deleteError'));
    } finally {
      this.busy.set(false);
    }
  }
}
