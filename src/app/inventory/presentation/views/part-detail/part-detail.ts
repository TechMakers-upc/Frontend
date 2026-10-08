import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { Dialog } from '../../../../shared/presentation/components/dialog/dialog';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { InventoryStore, StockMovementStore } from '../../../application/inventory.store';
import { MOVEMENT_TONE, STOCK_LEVEL_TONE } from '../../inventory-presentation';

@Component({
  selector: 'app-part-detail',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './part-detail.html',
  styleUrl: './part-detail.css',
})
export class PartDetail {
  private readonly inventory = inject(InventoryStore);
  private readonly movements = inject(StockMovementStore);
  private readonly plantStore = inject(PlantStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly directory = inject(UserDirectoryStore);

  readonly id = input.required<string>();

  protected readonly levelTone = STOCK_LEVEL_TONE;
  protected readonly movementTone = MOVEMENT_TONE;
  protected readonly dialog = signal<'entry' | 'adjust' | null>(null);
  protected readonly busy = signal(false);

  protected readonly part = computed(() => this.inventory.find(this.id()));
  protected readonly plant = computed(() => this.plantStore.find(this.part()?.plantId));
  protected readonly history = computed(() => this.movements.forPart(this.id()));
  protected readonly canManage = computed(() => this.session.role() === 'plant-manager');
  protected readonly fill = computed(() => {
    const part = this.part();
    if (!part) return 0;
    return Math.min(100, Math.round((part.stock / Math.max(part.minStock * 2, 1)) * 100));
  });

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly entryForm = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required, Validators.maxLength(120)]],
  });
  protected readonly adjustForm = this.fb.group({
    counted: [0, [Validators.required, Validators.min(0)]],
    reason: ['', [Validators.required, Validators.maxLength(120)]],
  });

  protected orderCode(id: string | null): string | null {
    return this.workOrderStore.find(id)?.code ?? null;
  }

  protected reasonLabel(reason: string): string {
    return reason === 'initial-stock' ? this.translate.instant('inventory.initialStock') : reason;
  }

  protected open(name: 'entry' | 'adjust'): void {
    this.entryForm.reset({ quantity: 1, reason: '' });
    this.adjustForm.reset({ counted: this.part()?.stock ?? 0, reason: '' });
    this.dialog.set(name);
  }

  protected async receive(): Promise<void> {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }
    const { quantity, reason } = this.entryForm.getRawValue();
    await this.run(
      () => this.inventory.receive(this.id(), Math.floor(Number(quantity)), reason),
      'inventory.received',
    );
  }

  protected async adjust(): Promise<void> {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }
    const { counted, reason } = this.adjustForm.getRawValue();
    await this.run(
      () => this.inventory.adjust(this.id(), Math.floor(Number(counted)), reason),
      'inventory.adjusted',
    );
  }

  private async run(action: () => Promise<unknown>, key: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await action();
      this.toast.success(this.translate.instant(key, { name: this.part()?.name }));
      this.dialog.set(null);
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.busy.set(false);
    }
  }
}
