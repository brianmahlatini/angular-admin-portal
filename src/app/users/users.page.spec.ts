import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL, User } from '../core/api';
import { UsersPage } from './users.page';

const users: User[] = [
  { id: 1, email: 'admin@example.test', name: 'Admin', role: 'admin', created_at: '2026-01-02T00:00:00Z' },
  { id: 2, email: 'bob@example.test', name: 'Bob', role: 'member', created_at: '2026-01-03T00:00:00Z' },
];

describe('UsersPage', () => {
  let ctrl: HttpTestingController;

  async function setup() {
    sessionStorage.setItem('admin-portal.session', JSON.stringify({ token: 't', user: users[0] }));
    TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: 'http://api.test' }],
    });
    ctrl = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(UsersPage);
    ctrl.expectOne('http://api.test/api/admin/users?page=1&per_page=20').flush({ data: users, meta: { page: 1, per_page: 20, total: 2, total_pages: 1 } });
    await fixture.whenStable();
    return fixture;
  }

  afterEach(() => {
    ctrl.verify();
    sessionStorage.clear();
  });

  it('lists users', async () => {
    const el: HTMLElement = (await setup()).nativeElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('bob@example.test');
    expect(el.querySelector('caption')?.textContent).toContain('2 users');
  });

  it('promotes a user through the API', async () => {
    const fixture = await setup();
    const p = fixture.componentInstance.changeRole(users[1]!, 'admin');
    const req = ctrl.expectOne('http://api.test/api/admin/users/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'admin' });
    req.flush({ user: { ...users[1], role: 'admin' } });
    await p;
    expect(fixture.componentInstance.users().find((u) => u.id === 2)?.role).toBe('admin');
  });

  it('rolls back and explains when the API refuses (last admin)', async () => {
    const fixture = await setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const p = fixture.componentInstance.changeRole(users[0]!, 'member');
    ctrl.expectOne('http://api.test/api/admin/users/1').flush(
      { title: 'Conflict', detail: 'Cannot demote the last remaining admin.' },
      { status: 409, statusText: 'Conflict' },
    );
    await p;
    await fixture.whenStable();
    expect(fixture.componentInstance.users()[0]?.role).toBe('admin');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('last remaining admin');
  });

  it('does nothing if you cancel removing your own admin access', async () => {
    const fixture = await setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await fixture.componentInstance.changeRole(users[0]!, 'member');
    ctrl.expectNone('http://api.test/api/admin/users/1');
  });
});
