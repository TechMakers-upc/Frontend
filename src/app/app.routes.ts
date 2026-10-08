import { Routes } from '@angular/router';

import { analyticsRoutes } from './analytics/analytics.routes';
import { assetManagementRoutes } from './asset-management/asset-management.routes';
import { homeRedirectGuard, signedInGuard } from './shared/presentation/session/session.guards';
import { sessionRoutes, sessionWorkspaceRoutes } from './shared/session.routes';
import { inventoryRoutes } from './inventory/inventory.routes';
import { maintenancePlanningRoutes } from './maintenance-planning/maintenance-planning.routes';
import { serviceExecutionRoutes } from './service-execution/service-execution.routes';

export const routes: Routes = [
  ...sessionRoutes,
  {
    path: '',
    canActivate: [signedInGuard],
    loadComponent: () =>
      import('./shared/presentation/layout/workspace-shell/workspace-shell').then((m) => m.WorkspaceShell),
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
      ...analyticsRoutes,
      ...assetManagementRoutes,
      ...serviceExecutionRoutes,
      ...maintenancePlanningRoutes,
      ...inventoryRoutes,
      ...sessionWorkspaceRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];
