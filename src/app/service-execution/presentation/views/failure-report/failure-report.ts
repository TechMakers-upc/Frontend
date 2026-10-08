import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { WorkOrderStore } from '../../../application/work-order.store';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AssetStore } from '../../../../asset-management/application/asset.store';
import { Asset } from '../../../../asset-management/domain/model/asset.entity';
import { ASSET_STATUS_TONE } from '../../../../asset-management/presentation/asset-presentation';
import { SessionStore } from '../../../../shared/application/session.store';
import { ROLE_HOME } from '../../../../shared/presentation/session/role-presentation';
import { ToastService } from '../../../../shared/application/toast.service';
import { Icon, IconName } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { QrScanner } from '../../../../shared/presentation/components/qr-scanner/qr-scanner';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { FailureStore } from '../../../application/failure.store';
import { MaintenanceExecutionService } from '../../../application/maintenance-execution.service';
import { FAILURE_KINDS, Failure, FailureKind } from '../../../domain/model/failure.entity';

const KIND_ICON: Record<FailureKind, IconName> = {
  'wont-start': 'power',
  noise: 'waves',
  leak: 'droplet',
  jam: 'ban',
  electrical: 'zap',
  other: 'help',
};

const RECENT_LIMIT = 4;

/** Three steps, as few taps as possible: machine → what happens → confirm. */
@Component({
  selector: 'app-failure-report',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, QrScanner, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-report.html',
  styleUrl: './failure-report.css',
})
export class FailureReport {
  private readonly assetStore = inject(AssetStore);
  private readonly failureStore = inject(FailureStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly execution = inject(MaintenanceExecutionService);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  /** Pre-selected from the machine sheet or its QR label (?assetId=). */
  readonly assetId = input<string>();

  protected readonly kinds = FAILURE_KINDS;
  protected readonly kindIcon = KIND_ICON;
  protected readonly statusTone = ASSET_STATUS_TONE;

  protected readonly step = signal<1 | 2 | 3>(1);
  protected readonly query = signal('');
  protected readonly selectedAsset = signal<Asset | null>(null);
  protected readonly kind = signal<FailureKind | null>(null);
  protected readonly description = signal('');
  protected readonly lineStopped = signal<boolean | null>(null);
  protected readonly attempted = signal(false);
  protected readonly sending = signal(false);
  protected readonly created = signal<Failure | null>(null);
  protected readonly presetNotice = signal<{ tone: 'ok' | 'warn'; key: string; code: string } | null>(null);

  protected readonly homeLink = computed(() => {
    const role = this.session.role();
    return role ? ROLE_HOME[role] : '/';
  });

  /** Spoken when the step changes, since the wizard swaps its content in place. */
  protected readonly stepAnnouncement = computed(() =>
    this.translate.instant('report.stepAnnounce', {
      n: this.step(),
      title: this.translate.instant(`report.step${this.step()}`),
    }),
  );

  /** Machines this user touched lately (their orders and reports), newest first. */
  protected readonly recent = computed(() => {
    const me = this.session.currentAccount()?.id;
    const touched = [
      ...this.workOrderStore.mine().map((order) => ({ assetId: order.assetId, at: order.startedAt ?? order.createdAt })),
      ...this.failureStore.inScope().filter((failure) => failure.reportedBy === me).map((failure) => ({ assetId: failure.assetId, at: failure.reportedAt })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    const ids = [...new Set(touched.map((entry) => entry.assetId))];
    return ids
      .map((id) => this.assetStore.inScope().find((asset) => asset.id === id))
      .filter((asset): asset is Asset => asset !== undefined)
      .slice(0, RECENT_LIMIT);
  });

  protected readonly assets = computed(() => {
    const text = this.query().trim().toLowerCase();
    return this.assetStore
      .inScope()
      .filter((asset) => !text || `${asset.code} ${asset.name} ${asset.location}`.toLowerCase().includes(text));
  });

  constructor() {
    effect(() => {
      const id = this.assetId();
      if (!id || this.assetStore.state() !== 'ready' || this.failureStore.state() !== 'ready') return;
      untracked(() => {
        if (this.presetNotice() || this.selectedAsset() !== null || this.step() !== 1) return;
        const preset = this.assetStore.inScope().find((asset) => asset.id === id);
        if (!preset) {
          this.presetNotice.set({ tone: 'warn', key: 'report.preset.notFound', code: '' });
        } else if (this.alreadyReported(preset)) {
          this.presetNotice.set({ tone: 'warn', key: 'report.preset.alreadyReported', code: preset.code });
        } else {
          this.selectedAsset.set(preset);
          this.step.set(2);
          this.presetNotice.set({ tone: 'ok', key: 'report.preset.selected', code: preset.code });
        }
      });
    });
  }

  /** A scanned label holds the report link (?assetId=) or, on older labels, just the machine code. */
  protected onScanned(text: string): void {
    let assetId: string | null = null;
    try {
      assetId = new URL(text, window.location.origin).searchParams.get('assetId');
    } catch {
      assetId = null;
    }
    const code = text.trim().toUpperCase();
    const asset = this.assetStore
      .inScope()
      .find((candidate) => candidate.id === assetId || candidate.code.toUpperCase() === code);
    if (!asset) {
      this.presetNotice.set({ tone: 'warn', key: 'report.preset.notFound', code: '' });
      return;
    }
    if (this.alreadyReported(asset)) {
      this.presetNotice.set({ tone: 'warn', key: 'report.preset.alreadyReported', code: asset.code });
      return;
    }
    this.presetNotice.set({ tone: 'ok', key: 'report.preset.scanned', code: asset.code });
    this.pickAsset(asset);
  }

  /** Arrow keys move through a radio group, as native radios do. */
  protected onStoppedKey(event: KeyboardEvent): void {
    this.moveRadio(event, [true, false], this.lineStopped(), (value) => this.lineStopped.set(value));
  }

  protected onKindKey(event: KeyboardEvent): void {
    this.moveRadio(event, this.kinds, this.kind(), (value) => this.kind.set(value));
  }

  private moveRadio<T>(event: KeyboardEvent, options: readonly T[], current: T | null, select: (value: T) => void): void {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    if (!forward && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const index = current === null ? -1 : options.indexOf(current);
    select(options[(index + (forward ? 1 : -1) + options.length) % options.length]!);
    const group = (event.currentTarget as HTMLElement).closest('[role="radiogroup"]');
    queueMicrotask(() => (group?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus());
  }

  protected alreadyReported(asset: Asset): boolean {
    return this.failureStore.openFor(asset.id).length > 0;
  }

  protected pickAsset(asset: Asset): void {
    this.selectedAsset.set(asset);
    this.attempted.set(false);
    this.step.set(2);
  }

  protected toConfirm(): void {
    this.attempted.set(true);
    if (!this.kind() || this.lineStopped() === null) return;
    this.attempted.set(false);
    this.step.set(3);
  }

  protected onDescription(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  protected async send(): Promise<void> {
    const asset = this.selectedAsset();
    const kind = this.kind();
    const lineStopped = this.lineStopped();
    if (!asset || !kind || lineStopped === null || this.sending()) return;
    this.sending.set(true);
    try {
      const failure = await this.execution.reportFailure({
        assetId: asset.id,
        kind,
        description: this.description(),
        lineStopped,
      });
      this.created.set(failure);
    } catch {
      this.toast.error(this.translate.instant('report.error'));
    } finally {
      this.sending.set(false);
    }
  }

  protected restart(): void {
    this.created.set(null);
    this.selectedAsset.set(null);
    this.kind.set(null);
    this.description.set('');
    this.lineStopped.set(null);
    this.query.set('');
    this.step.set(1);
  }
}
