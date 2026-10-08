import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../../shared/application/session.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { InventoryStore } from '../../../application/inventory.store';
import { PART_CATEGORIES, PartCategory } from '../../../domain/model/spare-part.entity';
import { STOCK_LEVEL_TONE } from '../../inventory-presentation';

@Component({
  selector: 'app-part-list',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './part-list.html',
  styleUrl: './part-list.css',
})
export class PartList {
  private readonly session = inject(SessionStore);
  private readonly scope = inject(PlantScope);
  private readonly router = inject(Router);
  protected readonly inventory = inject(InventoryStore);
  protected readonly plantStore = inject(PlantStore);

  readonly low = input<string | undefined>();

  protected readonly categories = PART_CATEGORIES;
  protected readonly levelTone = STOCK_LEVEL_TONE;
  protected readonly query = signal('');
  protected readonly category = signal<PartCategory | ''>('');
  protected readonly canManage = computed(() => this.session.role() === 'plant-manager');
  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected readonly visible = computed(() => {
    const text = this.query().trim().toLowerCase();
    const category = this.category();
    return this.inventory
      .inScope()
      .filter(
        (part) =>
          (!this.low() || part.isBelowMinimum) &&
          (!category || part.category === category) &&
          (!text || `${part.sku} ${part.name} ${part.location}`.toLowerCase().includes(text)),
      );
  });

  protected toggleLow(): void {
    void this.router.navigate([], {
      queryParams: { low: this.low() ? null : 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
