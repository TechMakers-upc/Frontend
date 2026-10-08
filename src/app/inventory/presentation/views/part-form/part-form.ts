import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { InventoryStore } from '../../../application/inventory.store';
import {
  PART_CATEGORIES,
  PART_UNITS,
  PartCategory,
  PartUnit,
  SparePartDetails,
} from '../../../domain/model/spare-part.entity';

@Component({
  selector: 'app-part-form',
  imports: [ReactiveFormsModule, TranslatePipe, Field, FieldInput, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './part-form.html',
  styleUrl: './part-form.css',
})
export class PartForm {
  private readonly inventory = inject(InventoryStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly categories = PART_CATEGORIES;
  protected readonly units = PART_UNITS;
  protected readonly saving = signal(false);
  protected readonly editing = computed(() => this.inventory.find(this.id()));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(24)]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['mechanical' as PartCategory, Validators.required],
    unit: ['unit' as PartUnit, Validators.required],
    minStock: [1, [Validators.required, Validators.min(0)]],
    initialStock: [0, [Validators.required, Validators.min(0)]],
    location: ['', Validators.maxLength(60)],
  });

  constructor() {
    effect(() => {
      const part = this.editing();
      if (part) untracked(() => this.form.reset({ ...part, initialStock: 0 }));
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { initialStock, ...rest } = this.form.getRawValue();
    const details: SparePartDetails = { ...rest, minStock: Math.floor(Number(rest.minStock)) };
    this.saving.set(true);
    try {
      const existing = this.editing();
      const saved = existing
        ? await this.inventory.change(existing.id, (draft) => draft.updateDetails(details))
        : await this.inventory.register(
            this.session.currentAccount()!.plantId!,
            details,
            Math.floor(Number(initialStock)),
          );
      this.toast.success(
        this.translate.instant(existing ? 'inventory.updated' : 'inventory.registered', {
          name: saved.name,
        }),
      );
      await this.router.navigate(['/inventory', saved.id]);
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
