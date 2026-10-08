import { Routes } from '@angular/router';

import { roleGuard } from '../shared/presentation/session/session.guards';

export const maintenancePlanningRoutes: Routes = [
  {
    path: 'maintenance',
    canActivate: [roleGuard('plant-manager', 'operations-manager')],
    title: 'nav.maintenance',
    loadComponent: () => import('./presentation/views/plan-list/plan-list').then((m) => m.PlanList),
  },
  {
    path: 'maintenance/new',
    canActivate: [roleGuard('plant-manager')],
    title: 'maintenance.newTitle',
    loadComponent: () => import('./presentation/views/plan-form/plan-form').then((m) => m.PlanForm),
  },
  {
    path: 'maintenance/:id/edit',
    canActivate: [roleGuard('plant-manager')],
    title: 'maintenance.editTitle',
    loadComponent: () => import('./presentation/views/plan-form/plan-form').then((m) => m.PlanForm),
  },
];
