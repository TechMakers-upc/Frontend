import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-mark.html',
  styleUrl: './brand-mark.css',
})
export class BrandMark {
  readonly size = input(28);
}
