import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { todayDate } from '../../../../shared/domain/model/date-time';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { WorkOrder } from '../../../domain/model/work-order.entity';
import { WORK_ORDER_STATUS_TONE } from '../../execution-presentation';

/** Mobile-first order card used on the technician's screens. */
@Component({
  selector: 'app-work-order-card',
  imports: [RouterLink, TranslatePipe, Icon, StatusBadge, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-order-card.html',
  styleUrl: './work-order-card.css',
})
export class WorkOrderCard {
  private readonly assetStore = inject(AssetStore);

  readonly order = input.required<WorkOrder>();

  protected readonly statusTone = WORK_ORDER_STATUS_TONE;
  protected readonly asset = computed(() => this.assetStore.find(this.order().assetId));
  protected readonly overdue = computed(() => this.order().isOverdue(todayDate()));
}
