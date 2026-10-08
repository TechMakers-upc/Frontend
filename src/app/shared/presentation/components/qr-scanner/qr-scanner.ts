import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, output, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../icon/icon';

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

type ScanState = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied';


@Component({
  selector: 'app-qr-scanner',
  imports: [TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScanner implements OnDestroy {
  readonly scanned = output<string>();

  protected readonly state = signal<ScanState>('idle');
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  private stream: MediaStream | null = null;
  private frame = 0;

  async start(): Promise<void> {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      this.state.set('unsupported');
      queueMicrotask(() => this.closeButton()?.nativeElement.focus());
      return;
    }
    this.state.set('starting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch {
      this.state.set('denied');
      queueMicrotask(() => this.closeButton()?.nativeElement.focus());
      return;
    }
    this.state.set('scanning');
    await Promise.resolve();
    const video = this.video()?.nativeElement;
    if (!video) return this.stop();
    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    this.closeButton()?.nativeElement.focus();
    const detector = new Detector({ formats: ['qr_code'] });
    const tick = async () => {
      if (this.state() !== 'scanning') return;
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue) {
          this.stop();
          this.scanned.emit(code.rawValue);
          return;
        }
      } catch {
      }
      this.frame = requestAnimationFrame(() => void tick());
    };
    void tick();
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.state.set('idle');
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
