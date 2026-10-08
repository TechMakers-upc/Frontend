const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return toDateOnly(new Date());
}

export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

export function daysUntil(dateOnly: string, from: string = todayDate()): number {
  const target = new Date(`${dateOnly}T00:00:00`).getTime();
  const origin = new Date(`${from}T00:00:00`).getTime();
  return Math.round((target - origin) / DAY_MS);
}

export function hoursBetween(startIso: string, endIso: string = nowIso()): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / HOUR_MS);
}

export function localDay(iso: string): string {
  return iso.length === 10 ? iso : toDateOnly(new Date(iso));
}

export function isWithin(iso: string, fromDate: string | null, toDate: string | null): boolean {
  const day = localDay(iso);
  return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
}
