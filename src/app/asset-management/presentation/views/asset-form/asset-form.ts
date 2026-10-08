import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { todayDate } from '../../../../shared/domain/model/date-time';
import { Field, FieldInput } from '../../../../shared/presentation/components/field/field';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { AssetStore } from '../../../application/asset.store';
import { ASSET_CATEGORIES, AssetCategory, AssetDetails, CRITICALITIES, Criticality } from '../../../domain/model/asset.entity';

@Component({
  selector: 'app-asset-form',
  imports: [ReactiveFormsModule, TranslatePipe, Field, FieldInput, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './asset-form.css',
  templateUrl: './asset-form.html',
})
export class AssetForm {
  private readonly assetStore = inject(AssetStore);
  private readonly session = inject(SessionStore);
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly id = input<string>();

  protected readonly categories = ASSET_CATEGORIES;
  protected readonly criticalities = CRITICALITIES;
  protected readonly saving = signal(false);
  protected readonly editing = computed(() => this.assetStore.find(this.id()));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['compressor' as AssetCategory, Validators.required],
    criticality: ['medium' as Criticality, Validators.required],
    location: ['', Validators.required],
    brand: [''],
    model: [''],
    serialNumber: [''],
    installedAt: [todayDate(), Validators.required],
    description: ['', Validators.maxLength(600)],
  });

  constructor() {
    effect(() => {
      const asset = this.editing();
      if (asset) untracked(() => this.form.reset({ ...asset }));
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const details: AssetDetails = this.form.getRawValue();
    this.saving.set(true);
    try {
      const existing = this.editing();
      const saved = existing
        ? await this.assetStore.change(existing.id, (draft) => draft.updateDetails(details))
        : await this.assetStore.register(this.session.currentAccount()!.plantId!, details);
      this.toast.success(this.translate.instant(existing ? 'assets.updated' : 'assets.registered', { name: saved.name }));
      await this.router.navigate(['/assets', saved.id]);
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
