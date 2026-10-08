import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly meta = input<string | null>(null);
  readonly backLink = input<string | unknown[] | null>(null);
}
