import { Routes } from '@angular/router';

import { roleGuard } from '../shared/presentation/session/session.guards';

export const analyticsRoutes: Routes = [
  {
    path: 'dashboard',
    canActivate: [roleGuard('plant-manager')],
    title: 'nav.dashboard',
    loadComponent: () => import('./presentation/views/plant-dashboard/plant-dashboard').then((m) => m.PlantDashboard),
  },
  {
    path: 'overview',
    canActivate: [roleGuard('operations-manager')],
    title: 'nav.overview',
    loadComponent: () =>
      import('./presentation/views/operations-overview/operations-overview').then((m) => m.OperationsOverview),
  },
  {
    path: 'technicians',
    canActivate: [roleGuard('operations-manager')],
    title: 'nav.technicians',
    loadComponent: () =>
      import('./presentation/views/technician-performance/technician-performance').then((m) => m.TechnicianPerformance),
  },
  {
    path: 'reports',
    canActivate: [roleGuard('plant-manager', 'operations-manager')],
    title: 'nav.reports',
    loadComponent: () =>
      import('./presentation/views/maintenance-report/maintenance-report').then((m) => m.MaintenanceReport),
  },
];
