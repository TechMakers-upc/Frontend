import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { MaintenancePlanStore } from '../../../../maintenance-planning/application/maintenance-plan.store';
import { FailureStore } from '../../../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { nowIso } from '../../../../shared/domain/model/date-time';
import { PlantTimeline } from '../../../../analytics/application/plant-timeline';
import { TranslatedTitleStrategy } from '../../../../shared/infrastructure/translated-title.strategy';
import { DayStrip } from '../../../../shared/presentation/components/day-strip/day-strip';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { Icon, IconName } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { BadgeTone, StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { AssetQrLabels } from '../../../application/asset-qr-labels';
import { AssetStore } from '../../../application/asset.store';
import { PlantStore } from '../../../application/plant.store';
import { Asset } from '../../../domain/model/asset.entity';
import { ASSET_STATUS_TONE, CRITICALITY_TONE } from '../../asset-presentation';

type Tab = 'sheet' | 'history' | 'manuals';

interface HistoryEntry {
  at: string;
  icon: IconName;
  tone: BadgeTone;
  titleKey: string;
  params: Record<string, string>;
  detail: string;
  link: unknown[] | null;
}

const urlPattern = Validators.pattern(/^https?:\/\/\S+$/i);

@Component({
  selector: 'app-asset-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DayStrip, Field, FieldInput, Icon, PageHeader, StatusBadge, LocalizedDatePipe, HoursPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css',
})
export class AssetDetail {
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly failureStore = inject(FailureStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly directory = inject(UserDirectoryStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly labels = inject(AssetQrLabels);
  private readonly timeline = inject(PlantTimeline);
  private readonly titleStrategy = inject(TitleStrategy);

  readonly id = input.required<string>();

  protected readonly tab = signal<Tab>('sheet');
  protected readonly savingManual = signal(false);
  protected readonly statusTone = ASSET_STATUS_TONE;
  protected readonly criticalityTone = CRITICALITY_TONE;

  protected readonly asset = computed(() => this.assetStore.find(this.id()));
  protected readonly plant = computed(() => this.plantStore.find(this.asset()?.plantId));
  protected readonly days = computed(() => {
    const asset = this.asset();
    return asset ? this.timeline.forAsset(asset) : [];
  });

  constructor() {
    effect(() => {
      const asset = this.asset();
      if (this.titleStrategy instanceof TranslatedTitleStrategy) {
        this.titleStrategy.setEntity(asset ? `${asset.code} ${asset.name}` : null);
      }
    });
  }
  protected readonly role = this.session.role;
  protected readonly canManage = computed(() => this.role() === 'plant-manager');

  protected readonly openFailures = computed(() =>
    this.failureStore.items().filter((failure) => failure.assetId === this.id() && !failure.isResolved),
  );

  protected readonly openOrders = computed(() =>
    this.workOrderStore.items().filter((order) => order.assetId === this.id() && order.isOpen),
  );

  protected readonly plans = computed(() => this.planStore.items().filter((plan) => plan.assetId === this.id()));

  protected readonly downtime = computed(() =>
    this.failureStore
      .items()
      .filter((failure) => failure.assetId === this.id())
      .reduce((sum, failure) => sum + failure.downtimeHours(), 0),
  );

  protected readonly history = computed<HistoryEntry[]>(() => {
    const id = this.id();
    const name = (userId: string | null) => this.directory.find(userId)?.fullName ?? '—';
    const entries: HistoryEntry[] = [];
    for (const failure of this.failureStore.items().filter((f) => f.assetId === id)) {
      entries.push({
        at: failure.reportedAt,
        icon: 'alert',
        tone: failure.isResolved ? 'neutral' : 'down',
        titleKey: 'assets.history.failure',
        params: { kind: this.translate.instant(`failureKind.${failure.kind}`), by: name(failure.reportedBy) },
        detail: failure.description,
        link: this.role() === 'technician' ? null : ['/failures', failure.id],
      });
    }
    for (const order of this.workOrderStore.items().filter((o) => o.assetId === id)) {
      entries.push({
        at: order.completedAt ?? order.startedAt ?? order.createdAt,
        icon: order.type === 'preventive' ? 'calendar' : 'wrench',
        tone: order.status === 'completed' ? 'ok' : order.status === 'in-progress' ? 'info' : 'warn',
        titleKey: `assets.history.order.${order.status}`,
        params: { code: order.code, type: this.translate.instant(`workOrderType.${order.type}`), by: name(order.technicianId) },
        detail: order.solution ?? order.title,
        link: ['/work-orders', order.id],
      });
    }
    return entries.sort((a, b) => b.at.localeCompare(a.at));
  });

  protected readonly myPendingOrder = computed(() => {
    const me = this.session.currentAccount()?.id;
    return this.openOrders().find((order) => order.technicianId === me && order.status === 'pending') ?? null;
  });

  protected downloadQr(asset: Asset): void {
    void this.labels.download(asset);
  }

  protected readonly manualForm = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    url: ['', [Validators.required, urlPattern]],
  });

  protected async addManual(): Promise<void> {
    if (this.manualForm.invalid || this.savingManual()) {
      this.manualForm.markAllAsTouched();
      return;
    }
    const { title, url } = this.manualForm.getRawValue();
    this.savingManual.set(true);
    try {
      await this.assetStore.change(this.id(), (draft) => draft.addManual(title, url, nowIso()));
      this.manualForm.reset();
      this.toast.success(this.translate.instant('assets.manuals.added'));
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.savingManual.set(false);
    }
  }

  protected async removeManual(index: number): Promise<void> {
    try {
      await this.assetStore.change(this.id(), (draft) => draft.removeManual(index));
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    }
  }
}
