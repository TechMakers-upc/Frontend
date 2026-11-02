import { Routes } from '@angular/router';

import { analyticsRoutes } from './analytics/analytics.routes';
import { assetManagementRoutes } from './asset-management/asset-management.routes';
import { inventoryRoutes } from './inventory/inventory.routes';
import { maintenancePlanningRoutes } from './maintenance-planning/maintenance-planning.routes';
import { serviceExecutionRoutes } from './service-execution/service-execution.routes';
import { homeRedirectGuard, signedInGuard, signedOutGuard } from './shared/presentation/session/session.guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'titles.signIn',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./shared/presentation/views/login/login').then((m) => m.Login),
  },
  // Previous public demonstration addresses lead to the real sign-in screen.
  { path: 'start', redirectTo: 'login', pathMatch: 'full' },
  { path: 'demo', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    canActivate: [signedInGuard],
    loadComponent: () =>
      import('./shared/presentation/layout/workspace-shell/workspace-shell')
        .then((m) => m.WorkspaceShell),
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
      ...analyticsRoutes,
      ...assetManagementRoutes,
      ...serviceExecutionRoutes,
      ...maintenancePlanningRoutes,
      ...inventoryRoutes,
    ],
  },
  { path: '**', redirectTo: 'login' },
];
