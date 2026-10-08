import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon, IconName } from '../icon/icon';

export type BadgeTone = 'ok' | 'warn' | 'down' | 'info' | 'neutral';

const TONE_ICON: Record<BadgeTone, IconName | null> = {
  ok: 'check',
  warn: 'clock',
  down: 'alert',
  info: 'play',
  neutral: null,
};

@Component({
  selector: 'app-status-badge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
  host: {
    class: 'badge',
    '[class]': "'badge badge--' + tone()",
  },
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
  readonly icon = input(true);

  protected iconFor(tone: BadgeTone): IconName | null {
    return TONE_ICON[tone];
  }
}
