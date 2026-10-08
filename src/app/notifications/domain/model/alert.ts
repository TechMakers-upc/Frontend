export type AlertKind = 'critical-failure' | 'maintenance-overdue' | 'maintenance-due' | 'work-order-assigned' | 'low-stock';

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: 'down' | 'warn' | 'info';
  /** Translation params for `alerts.<kind>`. */
  params: Record<string, string | number>;
  link: string;
  at: string;
}
