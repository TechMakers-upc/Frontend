import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { SessionStore } from '../../application/session.store';
import { homeRedirectGuard, roleGuard, signedInGuard } from './session.guards';

describe('Demo session guards', () => {
  let session: SessionStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    session.signOut();
  });

  afterEach(() => session.signOut());

  it('redirects unauthenticated demo navigation to /start', () => {
    const result = TestBed.runInInjectionContext(() =>
      signedInGuard({} as ActivatedRouteSnapshot, { url: '/assets' } as RouterStateSnapshot),
    );
    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree).startsWith('/start?')).toBe(true);
    expect(tree.queryParams['returnUrl']).toBe('/assets');
  });

  it('redirects unauthorized demo roles to their own home', () => {
    session.selectDemoRole('technician');
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('plant-manager')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/today');
  });

  it('redirects guests to /start and selected profiles to their own home', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const guest = TestBed.runInInjectionContext(() => homeRedirectGuard(route, state));
    expect(router.serializeUrl(guest as UrlTree)).toBe('/start');
    session.selectDemoRole('operations-manager');
    const selected = TestBed.runInInjectionContext(() => homeRedirectGuard(route, state));
    expect(router.serializeUrl(selected as UrlTree)).toBe('/overview');
  });
});
