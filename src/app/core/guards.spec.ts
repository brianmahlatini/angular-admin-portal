import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideRouter,
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { API_BASE_URL } from './api';
import { adminGuard } from './guards';

function run(session: unknown): boolean | UrlTree {
  sessionStorage.clear();
  if (session) sessionStorage.setItem('admin-portal.session', JSON.stringify(session));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      { provide: API_BASE_URL, useValue: 'http://api.test' },
    ],
  });
  return TestBed.runInInjectionContext(() =>
    adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('adminGuard', () => {
  afterEach(() => sessionStorage.clear());

  it('sends anonymous users to login', () => {
    expect(TestBed.inject(Router).serializeUrl(run(null) as UrlTree)).toBe('/login');
  });

  it('sends members to forbidden', () => {
    const tree = run({
      token: 't',
      user: { id: 2, email: 'm@x.test', name: 'M', role: 'member' },
    }) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/forbidden');
  });

  it('lets admins through', () => {
    expect(run({ token: 't', user: { id: 1, email: 'a@x.test', name: 'A', role: 'admin' } })).toBe(
      true,
    );
  });
});
