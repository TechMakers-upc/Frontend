import { Routes } from '@angular/router';

import { roleGuard } from '../shared/presentation/session/session.guards';

export const assetManagementRoutes: Routes = [
  {
    path: 'assets',
    title: 'nav.assets',
    loadComponent: () => import('./presentation/views/asset-list/asset-list').then((m) => m.AssetList),
  },
  {
    path: 'assets/new',
    canActivate: [roleGuard('plant-manager')],
    title: 'assets.newTitle',
    loadComponent: () => import('./presentation/views/asset-form/asset-form').then((m) => m.AssetForm),
  },
  {
    path: 'assets/labels',
    canActivate: [roleGuard('plant-manager', 'operations-manager')],
    title: 'assets.qr.title',
    loadComponent: () => import('./presentation/views/asset-labels/asset-labels').then((m) => m.AssetLabels),
  },
  {
    path: 'assets/:id',
    title: 'nav.assets',
    loadComponent: () => import('./presentation/views/asset-detail/asset-detail').then((m) => m.AssetDetail),
  },
  {
    path: 'assets/:id/edit',
    canActivate: [roleGuard('plant-manager')],
    title: 'assets.editTitle',
    loadComponent: () => import('./presentation/views/asset-form/asset-form').then((m) => m.AssetForm),
  },
  {
    path: 'my-plant',
    canActivate: [roleGuard('plant-manager')],
    title: 'nav.myPlant',
    loadComponent: () => import('./presentation/views/plant-form/plant-form').then((m) => m.PlantForm),
  },
  {
    path: 'plants',
    canActivate: [roleGuard('operations-manager')],
    title: 'nav.plants',
    loadComponent: () => import('./presentation/views/plant-list/plant-list').then((m) => m.PlantList),
  },
  {
    path: 'plants/new',
    canActivate: [roleGuard('operations-manager')],
    title: 'plants.newTitle',
    loadComponent: () => import('./presentation/views/plant-form/plant-form').then((m) => m.PlantForm),
  },
  {
    path: 'plants/:id',
    canActivate: [roleGuard('operations-manager')],
    title: 'nav.plants',
    loadComponent: () => import('./presentation/views/plant-detail/plant-detail').then((m) => m.PlantDetail),
  },
  {
    path: 'plants/:id/edit',
    canActivate: [roleGuard('operations-manager')],
    title: 'plants.editTitle',
    loadComponent: () => import('./presentation/views/plant-form/plant-form').then((m) => m.PlantForm),
  },
];
