export type DayState = 'ok' | 'warn' | 'down' | 'conflict' | 'none';

export interface DayCell {
  date: string;
  state: DayState;
}
