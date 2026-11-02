import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { SessionStore } from '../../application/session.store';
import { homeRedirectGuard, roleGuard, signedInGuard } from './session.guards';

describe('Authenticated session guards', () => {
  let session: SessionStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    session.signOut();
  });
  afterEach(() => session.signOut());

  it('redirects unauthenticated navigation to /login', () => {
    const result = TestBed.runInInjectionContext(() =>
      signedInGuard({} as ActivatedRouteSnapshot, { url: '/assets' } as RouterStateSnapshot),
    );
    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree).startsWith('/login?')).toBe(true);
    expect(tree.queryParams['returnUrl']).toBe('/assets');
  });

  it('redirects unauthorized accounts to their own home', () => {
    session.selectDemoRole('technician');
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('plant-manager')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/today');
  });

  it('redirects guests to /login and signed-in users to their home', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const guest = TestBed.runInInjectionContext(() => homeRedirectGuard(route, state));
    expect(router.serializeUrl(guest as UrlTree)).toBe('/login');
    session.selectDemoRole('operations-manager');
    const selected = TestBed.runInInjectionContext(() => homeRedirectGuard(route, state));
    expect(router.serializeUrl(selected as UrlTree)).toBe('/overview');
  });
});
