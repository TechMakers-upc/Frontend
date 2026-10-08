import { DOCUMENT, Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { QuickChartQrApi } from '../../shared/infrastructure/quickchart-qr-api';
import { Asset } from '../domain/model/asset.entity';


@Injectable({ providedIn: 'root' })
export class AssetQrLabels {
  private readonly qrApi = inject(QuickChartQrApi);

  readonly origin = (environment.publicAppUrl || inject(DOCUMENT).location.origin).replace(/\/$/, '');

  readonly pointsToLocalhost = /\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(this.origin);

  reportLink(asset: Asset): string {
    return `${this.origin}/failures/report?assetId=${encodeURIComponent(asset.id)}`;
  }

  imageUrl(asset: Asset, size = 320): string {
    return this.qrApi.imageUrl(this.reportLink(asset), { size });
  }

  download(asset: Asset): Promise<void> {
    return this.qrApi.download(this.reportLink(asset), `QR-${asset.code}`);
  }
}
