import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { FailureStore } from '../../../application/failure.store';
import { WorkOrderStore } from '../../../application/work-order.store';
import { FAILURE_STATUS_TONE, WORK_ORDER_STATUS_TONE } from '../../execution-presentation';
import { PrioritySelect } from '../../components/priority-select/priority-select';

@Component({
  selector: 'app-failure-detail',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, StatusBadge, PrioritySelect, LocalizedDatePipe, HoursPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-detail.html',
  styleUrl: './failure-detail.css',
})
export class FailureDetail {
  private readonly failureStore = inject(FailureStore);
  private readonly assetStore = inject(AssetStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  protected readonly directory = inject(UserDirectoryStore);

  readonly id = input.required<string>();

  protected readonly statusTone = FAILURE_STATUS_TONE;
  protected readonly orderTone = WORK_ORDER_STATUS_TONE;
  protected readonly failure = computed(() => this.failureStore.find(this.id()));
  protected readonly asset = computed(() => this.assetStore.find(this.failure()?.assetId));
  protected readonly order = computed(() => this.workOrderStore.find(this.failure()?.workOrderId));
}
