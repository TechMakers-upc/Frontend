import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { SessionStore } from '../../../application/session.store';
import { UserDirectoryStore } from '../../../application/user-directory.store';
import { InventoryStore, StockMovementStore } from '../../../../inventory/application/inventory.store';
import { MaintenancePlanStore } from '../../../../maintenance-planning/application/maintenance-plan.store';
import { AlertBell } from '../../../../notifications/presentation/components/alert-bell/alert-bell';
import { FailureStore } from '../../../../service-execution/application/failure.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { ToastService } from '../../../application/toast.service';
import { todayDate } from '../../../domain/model/date-time';
import { BrandMark } from '../../components/brand-mark/brand-mark';
import { Icon } from '../../components/icon/icon';
import { ToastHost } from '../../components/toast-host/toast-host';
import { MOBILE_NAVIGATION, NAVIGATION, NavCount, flatten } from '../navigation';
import {LanguageSwitcher} from '../../components/language-switcher/language-switcher';

@Component({
  selector: 'app-workspace-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, BrandMark, Icon, ToastHost, AlertBell, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.css',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class WorkspaceShell implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  protected readonly scope = inject(PlantScope);
  protected readonly plantStore = inject(PlantStore);
  private readonly assetStore = inject(AssetStore);
  private readonly failureStore = inject(FailureStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly planStore = inject(MaintenancePlanStore);
  private readonly inventory = inject(InventoryStore);

  private readonly stores = [
    this.plantStore,
    this.assetStore,
    this.planStore,
    this.failureStore,
    this.workOrderStore,
    this.inventory,
    inject(StockMovementStore),
    inject(UserDirectoryStore),
  ];

  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeInput');

  protected readonly account = this.session.currentAccount;
  protected readonly menuOpen = signal(false);
  protected readonly loadFailed = computed(() => this.stores.some((store) => store.state() === 'error'));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly inReport = computed(() => this.url().startsWith('/failures/report'));

  protected readonly groups = computed(() => {
    const role = this.account()?.role;
    return role ? NAVIGATION[role] : [];
  });

  protected readonly mobileNavigation = computed(() => {
    const role = this.account()?.role;
    if (!role) return [];
    const items = flatten(NAVIGATION[role]);
    return MOBILE_NAVIGATION[role]
      .map((path) => items.find((entry) => entry.path === path))
      .filter((entry) => entry !== undefined);
  });

  protected readonly counts = computed<Record<NavCount, number>>(() => {
    const today = todayDate();
    const me = this.account()?.id;
    const open = this.workOrderStore.inScope().filter((order) => order.isOpen);
    return {
      downAssets: this.assetStore.inScope().filter((asset) => asset.status === 'down').length,
      pendingFailures: this.failureStore.pending().length,
      openOrders: open.length,
      myOpenOrders: open.filter((order) => order.technicianId === me).length,
      overduePlans: this.planStore.inScope().filter((plan) => plan.isOverdue(today)).length,
      lowStock: this.inventory.belowMinimum().length,
    };
  });

  protected readonly alarming: ReadonlySet<NavCount> = new Set<NavCount>(['downAssets', 'overduePlans']);

  protected readonly isTechnician = computed(() => this.account()?.role === 'technician');
  protected readonly plantName = computed(() => this.plantStore.find(this.account()?.plantId)?.displayName ?? null);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    const force = this.loadFailed();
    for (const store of this.stores) store.load(force);
  }

  protected selectPlant(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.scope.select(value || null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    this.codeInput()?.nativeElement.focus();
  }

  protected async goToCode(event: Event): Promise<void> {
    event.preventDefault();
    const field = this.codeInput()?.nativeElement;
    const code = field?.value.trim().toUpperCase() ?? '';
    if (!code) return;
    const asset = this.assetStore.inScope().find((candidate) => candidate.code.toUpperCase() === code);
    const order = this.workOrderStore.inScope().find((candidate) => candidate.code.toUpperCase() === code);
    const target = asset ? ['/assets', asset.id] : order ? ['/work-orders', order.id] : null;
    if (!target) {
      this.toast.error(this.translate.instant('nav.codeNotFound', { code }));
      return;
    }
    if (field) {
      field.value = '';
      field.blur();
    }
    await this.router.navigate(target);
  }

  protected async signOut(): Promise<void> {
    this.session.signOut();
    await this.router.navigateByUrl('/demo');
  }
}
