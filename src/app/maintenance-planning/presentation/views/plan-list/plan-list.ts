import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { LanguageService } from '../../../../shared/application/language.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { daysUntil, todayDate } from '../../../../shared/domain/model/date-time';
import { Dialog } from '../../../../shared/presentation/components/dialog/dialog';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { BadgeTone, StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenancePlanStore } from '../../../application/maintenance-plan.store';
import { MaintenancePlan, PlanStanding } from '../../../domain/model/maintenance-plan.entity';

type View = 'calendar' | 'overdue' | 'suspended';

const STANDING_TONE: Record<PlanStanding, BadgeTone> = {
  overdue: 'down',
  'due-soon': 'warn',
  scheduled: 'ok',
  suspended: 'neutral',
};

@Component({
  selector: 'app-plan-list',
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink, TranslatePipe, Dialog, Field, FieldInput, Icon, PageHeader, StatusBadge, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css',
})
export class PlanList {
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  private readonly session = inject(SessionStore);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly directory = inject(UserDirectoryStore);

  protected readonly view = signal<View>('calendar');
  protected readonly standingTone = STANDING_TONE;
  protected readonly today = todayDate();
  protected readonly canManage = computed(() => this.session.role() === 'plant-manager');
  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected readonly active = computed(() => this.planStore.inScope().filter((plan) => plan.active));
  protected readonly overdue = this.planStore.overdue;
  protected readonly suspended = computed(() => this.planStore.inScope().filter((plan) => !plan.active));

  /** US14: upcoming work grouped by month. */
  protected readonly months = computed(() => {
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    const format = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const groups = new Map<string, { label: string; plans: MaintenancePlan[] }>();
    for (const plan of this.active().filter((p) => !p.isOverdue(this.today))) {
      const key = plan.nextDueDate.slice(0, 7);
      if (!groups.has(key)) groups.set(key, { label: format.format(new Date(`${key}-01T00:00:00`)), plans: [] });
      groups.get(key)!.plans.push(plan);
    }
    return [...groups.values()];
  });

  protected readonly rescheduling = signal<MaintenancePlan | null>(null);
  protected readonly busy = signal(false);
  protected readonly rescheduleForm = inject(FormBuilder).nonNullable.group({
    date: ['', Validators.required],
  });

  /** A plan with an open order already in progress shouldn't spawn a duplicate. */
  private readonly openOrderByPlan = computed(
    () => new Map(this.workOrderStore.items().filter((o) => o.planId && o.isOpen).map((o) => [o.planId!, o])),
  );

  protected openOrderFor(planId: string) {
    return this.openOrderByPlan().get(planId);
  }

  protected assetLabel(id: string): string {
    const asset = this.assetStore.find(id);
    return asset ? `${asset.code} · ${asset.name}` : '—';
  }

  protected plantName(id: string): string {
    return this.plantStore.find(id)?.displayName ?? '';
  }

  protected daysLeft(plan: MaintenancePlan): number {
    return daysUntil(plan.nextDueDate, this.today);
  }

  protected openReschedule(plan: MaintenancePlan): void {
    this.rescheduleForm.reset({ date: plan.nextDueDate < this.today ? this.today : plan.nextDueDate });
    this.rescheduling.set(plan);
  }

  protected async reschedule(): Promise<void> {
    const plan = this.rescheduling();
    if (!plan || this.rescheduleForm.invalid) {
      this.rescheduleForm.markAllAsTouched();
      return;
    }
    const { date } = this.rescheduleForm.getRawValue();
    if (await this.run(() => this.planStore.change(plan.id, (draft) => draft.reschedule(date)), 'maintenance.rescheduled', plan)) {
      this.rescheduling.set(null);
    }
  }

  protected toggle(plan: MaintenancePlan): Promise<boolean> {
    return plan.active
      ? this.run(() => this.planStore.change(plan.id, (draft) => draft.suspend()), 'maintenance.suspended', plan)
      : this.run(() => this.planStore.change(plan.id, (draft) => draft.reactivate()), 'maintenance.reactivated', plan);
  }

  private async run(action: () => Promise<unknown>, key: string, plan: MaintenancePlan): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.translate.instant(key, { title: plan.title }));
      return true;
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
