import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-kpi-card',
  imports: [NgTemplateOutlet, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css',
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<IconName>();
  readonly hint = input<string | null>(null);
  readonly tone = input<'neutral' | 'ok' | 'warn' | 'down' | 'info'>('neutral');
  readonly link = input<string | null>(null);
  readonly query = input<Record<string, string> | null>(null);
}
