import { Routes } from '@angular/router';

import { analyticsRoutes } from './analytics/analytics.routes';
import { assetManagementRoutes } from './asset-management/asset-management.routes';
import { inventoryRoutes } from './inventory/inventory.routes';
import { maintenancePlanningRoutes } from './maintenance-planning/maintenance-planning.routes';
import { serviceExecutionRoutes } from './service-execution/service-execution.routes';
import { homeRedirectGuard, signedInGuard } from './shared/presentation/session/session.guards';

export const routes: Routes = [
  {
    path: 'start',
    title: 'FixCore',
    loadComponent: () =>
      import('./shared/presentation/views/demo-access/demo-access')
        .then((m) => m.DemoAccess),
  },
  {
    path: '',
    canActivate: [signedInGuard],
    loadComponent: () =>
      import('./shared/presentation/layout/workspace-shell/workspace-shell')
        .then((m) => m.WorkspaceShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [homeRedirectGuard],
        children: [],
      },
      ...analyticsRoutes,
      ...assetManagementRoutes,
      ...serviceExecutionRoutes,
      ...maintenancePlanningRoutes,
      ...inventoryRoutes,
    ],
  },
  { path: '**', redirectTo: 'start' },
];
