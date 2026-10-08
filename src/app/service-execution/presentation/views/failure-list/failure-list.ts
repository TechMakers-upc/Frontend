import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { FailureStore } from '../../../application/failure.store';
import { FAILURE_STATUS_TONE } from '../../execution-presentation';
import { PrioritySelect } from '../../components/priority-select/priority-select';

@Component({
  selector: 'app-failure-list',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, StatusBadge, PrioritySelect, LocalizedDatePipe, HoursPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './failure-list.css',
  templateUrl: './failure-list.html',
})
export class FailureList {
  private readonly failureStore = inject(FailureStore);
  private readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  protected readonly directory = inject(UserDirectoryStore);

  protected readonly view = signal<'pending' | 'resolved'>('pending');
  protected readonly statusTone = FAILURE_STATUS_TONE;
  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected readonly pending = this.failureStore.pending;
  protected readonly resolved = computed(() => this.failureStore.inScope().filter((failure) => failure.isResolved));
  protected readonly visible = computed(() => (this.view() === 'pending' ? this.pending() : this.resolved()));

  protected assetLabel(id: string): string {
    const asset = this.assetStore.find(id);
    return asset ? `${asset.code} · ${asset.name}` : '—';
  }

  protected plantName(id: string): string {
    return this.plantStore.find(id)?.displayName ?? '';
  }
}
