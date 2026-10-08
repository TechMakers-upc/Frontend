import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { PlantStore } from '../../../application/plant.store';


@Component({
  selector: 'app-plant-form',
  imports: [ReactiveFormsModule, TranslatePipe, Field, FieldInput, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plant-form.html',
  styleUrl: './plant-form.css',
})
export class PlantForm {
  private readonly plantStore = inject(PlantStore);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly id = input<string>();

  protected readonly saving = signal(false);
  protected readonly isOwnPlant = computed(() => !this.id() && this.session.role() === 'plant-manager');
  protected readonly editing = computed(() =>
    this.plantStore.find(this.isOwnPlant() ? this.session.currentAccount()?.plantId : this.id()),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    city: ['', [Validators.required, Validators.maxLength(60)]],
    address: ['', Validators.maxLength(120)],
  });

  constructor() {
    effect(() => {
      const plant = this.editing();
      if (plant) untracked(() => this.form.reset({ name: plant.name, city: plant.city, address: plant.address }));
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const details = this.form.getRawValue();
    this.saving.set(true);
    try {
      const existing = this.editing();
      const saved = existing
        ? await this.plantStore.change(existing.id, (draft) => draft.updateDetails(details))
        : await this.plantStore.register(details);
      this.form.reset(details);
      this.toast.success(this.translate.instant(existing ? 'plants.updated' : 'plants.registered', { name: saved.name }));
      if (!this.isOwnPlant()) await this.router.navigate(['/plants', saved.id]);
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
