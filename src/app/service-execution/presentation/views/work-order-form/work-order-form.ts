import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { MaintenancePlanStore } from '../../../../maintenance-planning/application/maintenance-plan.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { addDays, todayDate } from '../../../../shared/domain/model/date-time';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { FailureStore } from '../../../application/failure.store';
import { MaintenanceExecutionService } from '../../../application/maintenance-execution.service';
import { WorkOrderStore } from '../../../application/work-order.store';
import { Priority, PRIORITIES } from '../../../domain/model/priority';
import { WORK_ORDER_TYPES, WorkOrderType } from '../../../domain/model/work-order.entity';

const DUE_DAYS: Record<Priority, number> = { critical: 0, high: 1, medium: 3, low: 7 };

@Component({
  selector: 'app-work-order-form',
  imports: [ReactiveFormsModule, TranslatePipe, Field, FieldInput, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './work-order-form.css',
  templateUrl: './work-order-form.html',
})
export class WorkOrderForm {
  private readonly execution = inject(MaintenanceExecutionService);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly failureStore = inject(FailureStore);
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  private readonly directory = inject(UserDirectoryStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly router = inject(Router);

  /** Route param when editing. */
  readonly id = input<string>();
  readonly failureId = input<string>();
  readonly planId = input<string>();
  readonly assetId = input<string>();

  protected readonly types = WORK_ORDER_TYPES;
  protected readonly priorities = PRIORITIES;
  protected readonly saving = signal(false);

  protected readonly editing = computed(() => this.workOrderStore.find(this.id()));
  protected readonly failure = computed(() => this.failureStore.find(this.failureId()));
  protected readonly plan = computed(() => this.planStore.find(this.planId()));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    type: ['corrective' as WorkOrderType, Validators.required],
    assetId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(800)],
    priority: ['medium' as Priority, Validators.required],
    dueDate: [addDays(todayDate(), 3), Validators.required],
    technicianId: [''],
  });

  private readonly selectedAssetId = toSignal(this.form.controls.assetId.valueChanges, { initialValue: '' });

  protected readonly assetGroups = computed(() =>
    this.scope.plantIds().map((plantId) => ({
      plant: this.plantStore.find(plantId),
      assets: this.assetStore.inScope().filter((asset) => asset.plantId === plantId),
    })),
  );

  /** Only technicians from the machine's plant can take the order. */
  protected readonly technicians = computed(() => {
    const plantId = this.assetStore.find(this.selectedAssetId() || this.form.controls.assetId.value)?.plantId;
    return this.directory.accounts().filter((user) => user.role === 'technician' && user.plantId === plantId);
  });

  constructor() {
    effect(() => {
      const order = this.editing();
      const failure = this.failure();
      const plan = this.plan();
      const assetId = this.assetId();
      untracked(() => {
        if (order) {
          this.form.reset({ ...order, technicianId: order.technicianId ?? '' });
          this.form.controls.type.disable();
          this.form.controls.assetId.disable();
        } else if (failure) {
          const priority = failure.priority ?? 'high';
          this.form.patchValue({
            type: 'corrective',
            assetId: failure.assetId,
            title: this.translate.instant('workOrders.fromFailureTitle', {
              kind: this.translate.instant(`failureKind.${failure.kind}`),
            }),
            description: failure.description,
            priority,
            dueDate: addDays(todayDate(), DUE_DAYS[priority]),
          });
        } else if (plan) {
          this.form.patchValue({
            type: 'preventive',
            assetId: plan.assetId,
            title: plan.title,
            description: plan.tasks,
            priority: 'medium',
            dueDate: plan.nextDueDate < todayDate() ? todayDate() : plan.nextDueDate,
            technicianId: plan.technicianId ?? '',
          });
        } else if (assetId) {
          this.form.patchValue({ assetId });
        }
      });
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const technicianId = values.technicianId || null;
    this.saving.set(true);
    try {
      const existing = this.editing();
      let orderId: string;
      if (existing) {
        const saved = await this.workOrderStore.change(existing.id, (draft) => {
          draft.updateDetails(values);
          if (technicianId && technicianId !== draft.technicianId) draft.assign(technicianId);
        });
        orderId = saved.id;
        this.toast.success(this.translate.instant('workOrders.updated', { code: saved.code }));
      } else {
        const created = await this.execution.createWorkOrder({
          ...values,
          technicianId,
          failureId: this.failure()?.id ?? null,
          planId: this.plan()?.id ?? null,
        });
        orderId = created.id;
        this.toast.success(this.translate.instant('workOrders.created', { code: created.code }));
      }
      await this.router.navigate(['/work-orders', orderId]);
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
