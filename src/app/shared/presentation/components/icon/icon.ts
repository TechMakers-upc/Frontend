import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICONS = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  home: ['M3 10.5 12 3l9 7.5', 'M5 9v12h14V9', 'M10 21v-6h4v6'],
  factory: ['M3 21V10l5 3v-3l5 3V4h4l1 6h3v11Z', 'M7 17h2', 'M12 17h2', 'M17 17h1'],
  machine: [
    'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
    'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M12 2v2',
    'M12 22v-2',
    'm17 20.66-1-1.73',
    'M11 10.27 7 3.34',
    'm20.66 17-1.73-1',
    'm3.34 7 1.73 1',
    'M14 12h8',
    'M2 12h2',
    'm20.66 7-1.73 1',
    'm3.34 17 1.73-1',
    'm17 3.34-1 1.73',
    'm11 13.73-4 6.93',
  ],
  alert: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
  clipboard: [
    'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z',
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
    'M9 12h6',
    'M9 16h6',
  ],
  calendar: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  box: ['M21 8 12 3 3 8v8l9 5 9-5Z', 'M3 8l9 5 9-5', 'M12 13v8'],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M22 21v-2a4 4 0 0 0-3-3.9',
    'M16 3.1a4 4 0 0 1 0 7.8',
  ],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  chart: ['M3 3v18h18', 'M8 16v-4', 'M13 16V8', 'M18 16v-7'],
  report: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h8'],
  bell: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.9 1.9 0 0 0 3.4 0'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M21 21l-4.3-4.3'],
  wrench: [
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z',
  ],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  play: ['M7 4v16l13-8Z'],
  pause: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  pencil: ['M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z', 'M15 5l4 4'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z'],
  history: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  external: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
  printer: ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  qr: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h3v3h-3z', 'M20 14v.01', 'M14 20h.01', 'M17 17h4v4h-4'],
  link: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'],
  refresh: ['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M8 16H3v5'],
  'arrow-down': ['M12 5v14', 'M19 12l-7 7-7-7'],
  'arrow-up': ['M12 19V5', 'M5 12l7-7 7 7'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
  power: ['M12 2v10', 'M18.4 6.6a9 9 0 1 1-12.8 0'],
  waves: ['M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  droplet: ['M12 2.7 6.3 9a8 8 0 1 0 11.4 0Z'],
  ban: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M4.9 4.9l14.2 14.2'],
  zap: ['M13 2 3 14h9l-1 8 10-12h-9Z'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  'arrow-right': ['M5 12h14', 'M12 5l7 7-7 7'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly stroke = input(1.9);

  protected readonly paths = computed(() => ICONS[this.name()]);
}
