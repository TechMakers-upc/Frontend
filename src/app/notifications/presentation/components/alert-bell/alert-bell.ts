import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon, IconName } from '../../../../shared/presentation/components/icon/icon';
import { AlertCenter } from '../../../application/alert-center';
import { AlertKind } from '../../../domain/model/alert';

const KIND_ICON: Record<AlertKind, IconName> = {
  'critical-failure': 'alert',
  'maintenance-overdue': 'calendar',
  'maintenance-due': 'calendar',
  'work-order-assigned': 'clipboard',
  'low-stock': 'box',
};

@Component({
  selector: 'app-alert-bell',
  imports: [RouterLink, TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-bell.html',
  styleUrl: './alert-bell.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class AlertBell {
  protected readonly center = inject(AlertCenter);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly icons = KIND_ICON;

  protected toggle(): void {
    const opening = !this.open();
    this.open.set(opening);
    if (!opening) this.center.markAllSeen();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
      this.center.markAllSeen();
    }
  }
}
