import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { addDays, todayDate } from '../../../../shared/domain/model/date-time';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { MaintenancePlanStore } from '../../../application/maintenance-plan.store';
import { FREQUENCY_PRESETS, MaintenancePlanDetails } from '../../../domain/model/maintenance-plan.entity';

@Component({
  selector: 'app-plan-form',
  imports: [ReactiveFormsModule, TranslatePipe, Field, FieldInput, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-form.html',
  styleUrl: './plan-form.css',
})
export class PlanForm {
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly assetStore = inject(AssetStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly directory = inject(UserDirectoryStore);
  protected readonly router = inject(Router);

  readonly id = input<string>();
  readonly assetId = input<string>();

  protected readonly presets = FREQUENCY_PRESETS;
  protected readonly saving = signal(false);
  protected readonly assets = this.assetStore.inScope;
  protected readonly editing = computed(() => this.planStore.find(this.id()));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    assetId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(100)]],
    tasks: ['', Validators.maxLength(1000)],
    frequencyPreset: ['30'],
    frequencyDays: [30, [Validators.required, Validators.min(1), Validators.max(730)]],
    nextDueDate: [addDays(todayDate(), 7), Validators.required],
    technicianId: [''],
  });

  private readonly preset = toSignal(this.form.controls.frequencyPreset.valueChanges, { initialValue: '30' });
  protected readonly custom = computed(() => this.preset() === 'custom');

  constructor() {
    effect(() => {
      const plan = this.editing();
      const assetId = this.assetId();
      untracked(() => {
        if (plan) {
          const preset = (FREQUENCY_PRESETS as readonly number[]).includes(plan.frequencyDays) ? String(plan.frequencyDays) : 'custom';
          this.form.reset({ ...plan, technicianId: plan.technicianId ?? '', frequencyPreset: preset });
        } else if (assetId) {
          this.form.patchValue({ assetId });
        }
      });
    });
  }

  protected async save(): Promise<void> {
    const values = this.form.getRawValue();
    if (!this.custom()) this.form.controls.frequencyDays.setValue(Number(values.frequencyPreset));
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const details: MaintenancePlanDetails = {
      assetId: values.assetId,
      title: values.title,
      tasks: values.tasks,
      frequencyDays: this.custom() ? Number(values.frequencyDays) : Number(values.frequencyPreset),
      nextDueDate: values.nextDueDate,
      technicianId: values.technicianId || null,
    };
    this.saving.set(true);
    try {
      const existing = this.editing();
      if (existing) {
        await this.planStore.change(existing.id, (draft) => draft.updateDetails(details));
      } else {
        const plantId = this.assetStore.find(details.assetId)?.plantId ?? this.session.currentAccount()!.plantId!;
        await this.planStore.schedule(plantId, details);
      }
      this.toast.success(this.translate.instant(existing ? 'maintenance.updated' : 'maintenance.created', { title: details.title }));
      await this.router.navigateByUrl('/maintenance');
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
