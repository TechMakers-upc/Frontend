import { Role } from '../../domain/model/role';
import { IconName } from '../components/icon/icon';

export type NavCount = 'downAssets' | 'pendingFailures' | 'openOrders' | 'myOpenOrders' | 'overduePlans' | 'lowStock';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: IconName;
  count?: NavCount;
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const item = (path: string, key: string, icon: IconName, count?: NavCount): NavItem => ({
  path,
  labelKey: `nav.${key}`,
  icon,
  count,
});

const group = (key: string, items: NavItem[]): NavGroup => ({ labelKey: `nav.groups.${key}`, items });

export const NAVIGATION: Record<Role, NavGroup[]> = {
  'plant-manager': [
    group('operation', [
      item('/dashboard', 'dashboard', 'dashboard'),
      item('/assets', 'assets', 'machine', 'downAssets'),
      item('/failures', 'failures', 'alert', 'pendingFailures'),
      item('/work-orders', 'workOrders', 'clipboard', 'openOrders'),
    ]),
    group('planning', [
      item('/maintenance', 'maintenance', 'calendar', 'overduePlans'),
      item('/inventory', 'inventory', 'box', 'lowStock'),
    ]),
    group('plant', [
      item('/reports', 'reports', 'report'),
      item('/my-plant', 'myPlant', 'factory'),
    ]),
  ],
  'operations-manager': [
    group('operation', [
      item('/overview', 'overview', 'dashboard'),
      item('/plants', 'plants', 'factory', 'downAssets'),
      item('/work-orders', 'workOrders', 'clipboard', 'openOrders'),
    ]),
    group('planning', [
      item('/maintenance', 'scheduled', 'calendar', 'overduePlans'),
      item('/technicians', 'technicians', 'users'),
    ]),
    group('management', [item('/reports', 'reports', 'report')]),
  ],
  technician: [
    group('work', [
      item('/today', 'today', 'home'),
      item('/work-orders', 'myOrders', 'clipboard', 'myOpenOrders'),
      item('/assets', 'assets', 'machine', 'downAssets'),
      item('/inventory', 'stock', 'box'),
      item('/profile', 'profile', 'user'),
    ]),
  ],
};

export const MOBILE_NAVIGATION: Record<Role, string[]> = {
  'plant-manager': ['/dashboard', '/work-orders', '/assets', '/inventory'],
  'operations-manager': ['/overview', '/plants', '/work-orders', '/reports'],
  technician: ['/today', '/work-orders', '/assets', '/inventory'],
};

export function flatten(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((entry) => entry.items);
}
