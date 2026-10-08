import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, TitleStrategy } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { InventoryStore } from '../../../../inventory/application/inventory.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { TranslatedTitleStrategy } from '../../../../shared/infrastructure/translated-title.strategy';
import { nowIso, todayDate } from '../../../../shared/domain/model/date-time';
import { Dialog } from '../../../../shared/presentation/components/dialog/dialog';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { Icon, IconName } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenanceExecutionService } from '../../../application/maintenance-execution.service';
import { WorkOrderStore } from '../../../application/work-order.store';
import { PRIORITY_TONE, WORK_ORDER_STATUS_TONE } from '../../execution-presentation';

type DialogName = 'assign' | 'part' | 'close' | null;

interface TimelineEntry {
  at: string;
  icon: IconName;
  text: string;
  detail?: string;
}

@Component({
  selector: 'app-work-order-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Dialog,
    Field,
    FieldInput,
    Icon,
    PageHeader,
    StatusBadge,
    LocalizedDatePipe,
    HoursPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-order-detail.html',
  styleUrl: './work-order-detail.css',
})
export class WorkOrderDetail {
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly inventory = inject(InventoryStore);
  private readonly execution = inject(MaintenanceExecutionService);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly directory = inject(UserDirectoryStore);

  readonly id = input.required<string>();

  protected readonly statusTone = WORK_ORDER_STATUS_TONE;
  protected readonly priorityTone = PRIORITY_TONE;
  protected readonly dialog = signal<DialogName>(null);
  protected readonly busy = signal(false);

  protected readonly order = computed(() => this.workOrderStore.find(this.id()));
  private readonly titleStrategy = inject(TitleStrategy);
  private readonly orderTitle = effect(() => {
    const order = this.order();
    if (this.titleStrategy instanceof TranslatedTitleStrategy) this.titleStrategy.setEntity(order ? order.code : null);
  });
  protected readonly asset = computed(() => this.assetStore.find(this.order()?.assetId));
  protected readonly plant = computed(() => this.plantStore.find(this.order()?.plantId));
  protected readonly technician = computed(() => this.directory.find(this.order()?.technicianId));
  protected readonly overdue = computed(() => this.order()?.isOverdue(todayDate()) ?? false);

  private readonly me = computed(() => this.session.currentAccount());
  protected readonly isManager = computed(() => this.me()?.role !== 'technician');
  /** Only the assigned technician executes the order (US28–US30). */
  protected readonly isAssignee = computed(() => !!this.me() && this.order()?.technicianId === this.me()!.id);

  protected readonly plantTechnicians = computed(() =>
    this.directory.accounts().filter((u) => u.role === 'technician' && u.plantId === this.order()?.plantId),
  );

  protected readonly availableParts = computed(() =>
    this.inventory.items().filter((part) => part.plantId === this.order()?.plantId && part.stock > 0),
  );

  protected readonly partsUsed = computed(() =>
    (this.order()?.partsUsed ?? []).map((usage) => ({ ...usage, part: this.inventory.find(usage.partId) })),
  );

  protected readonly timeline = computed<TimelineEntry[]>(() => {
    const order = this.order();
    if (!order) return [];
    const name = (id: string | null) => this.directory.find(id)?.fullName ?? '—';
    const t = (key: string, params?: object) => this.translate.instant(key, params);
    const entries: TimelineEntry[] = [
      { at: order.createdAt, icon: 'plus', text: t('workOrders.timeline.created', { by: name(order.createdBy) }) },
    ];
    if (order.startedAt) {
      entries.push({ at: order.startedAt, icon: 'play', text: t('workOrders.timeline.started', { by: name(order.technicianId) }) });
    }
    for (const entry of order.workLog) {
      entries.push({ at: entry.at, icon: 'pencil', text: t('workOrders.timeline.note', { by: name(entry.authorId) }), detail: entry.note });
    }
    for (const usage of order.partsUsed) {
      const part = this.inventory.find(usage.partId);
      entries.push({ at: usage.at, icon: 'box', text: t('workOrders.timeline.part', { qty: usage.quantity, part: part?.name ?? '' }) });
    }
    if (order.completedAt) {
      entries.push({ at: order.completedAt, icon: 'check', text: t('workOrders.timeline.completed'), detail: order.solution ?? '' });
    }
    return entries.sort((a, b) => a.at.localeCompare(b.at));
  });

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly noteForm = this.fb.group({ note: ['', [Validators.required, Validators.maxLength(500)]] });
  protected readonly assignForm = this.fb.group({ technicianId: ['', Validators.required] });
  protected readonly partForm = this.fb.group({
    partId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });
  protected readonly closeForm = this.fb.group({ solution: ['', [Validators.required, Validators.maxLength(800)]] });

  protected openDialog(name: Exclude<DialogName, null>): void {
    if (name === 'assign') this.assignForm.reset({ technicianId: this.order()?.technicianId ?? '' });
    if (name === 'part') {
      this.partForm.reset({ partId: '', quantity: 1 });
      this.stockShort.set(false);
    }
    if (name === 'close') this.closeForm.reset();
    this.dialog.set(name);
  }

  protected maxFor(partId: string): number {
    return this.inventory.find(partId)?.stock ?? 0;
  }

  protected async start(): Promise<void> {
    await this.run(() => this.execution.start(this.id()), 'workOrders.startedToast');
  }

  protected async addNote(): Promise<void> {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }
    const { note } = this.noteForm.getRawValue();
    const author = this.me()!.id;
    const done = await this.run(
      () => this.workOrderStore.change(this.id(), (draft) => draft.logWork(note, author, nowIso())),
      'workOrders.noteSaved',
    );
    if (done) this.noteForm.reset();
  }

  protected async assign(): Promise<void> {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const { technicianId } = this.assignForm.getRawValue();
    const done = await this.run(
      () => this.workOrderStore.change(this.id(), (draft) => draft.assign(technicianId)),
      'workOrders.assigned',
      { name: this.directory.find(technicianId)?.fullName ?? '' },
    );
    if (done) this.dialog.set(null);
  }

  protected readonly stockShort = signal(false);

  protected async usePart(): Promise<void> {
    const { partId, quantity } = this.partForm.getRawValue();
    this.stockShort.set(!!partId && quantity > this.maxFor(partId));
    if (this.partForm.invalid || this.stockShort()) {
      this.partForm.markAllAsTouched();
      return;
    }
    const done = await this.run(() => this.execution.useParts(this.id(), partId, quantity), 'workOrders.partUsed');
    if (done) this.dialog.set(null);
  }

  protected async close(): Promise<void> {
    if (this.closeForm.invalid) {
      this.closeForm.markAllAsTouched();
      return;
    }
    const { solution } = this.closeForm.getRawValue();
    const done = await this.run(() => this.execution.complete(this.id(), solution), 'workOrders.closed');
    if (done) this.dialog.set(null);
  }

  private async run(action: () => Promise<unknown>, successKey: string, params: object = {}): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.translate.instant(successKey, { code: this.order()?.code, ...params }));
      return true;
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
