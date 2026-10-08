import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface QrOptions {
  size?: number;
  format?: 'png' | 'svg';
  dark?: string;
  light?: string;
  margin?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}


@Injectable({ providedIn: 'root' })
export class QuickChartQrApi {
  private readonly baseUrl = environment.quickChartBaseUrl.replace(/\/$/, '');

  imageUrl(text: string, options: QrOptions = {}): string {
    const { size = 240, format = 'png', dark = '0f172a', light = 'ffffff', margin = 2, errorCorrection = 'H' } = options;
    const params = new URLSearchParams({
      text,
      size: String(size),
      format,
      dark,
      light,
      margin: String(margin),
      ecLevel: errorCorrection,
    });
    return `${this.baseUrl}/qr?${params}`;
  }

  async download(text: string, fileName: string): Promise<void> {
    const url = this.imageUrl(text, { size: 600 });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`QuickChart answered ${response.status}`);
      const href = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = href;
      link.download = `${fileName}.png`;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  }
}
