import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.setItem(
      'admin-portal.session',
      JSON.stringify({
        token: 'tok',
        user: { id: 1, email: 'a@x.test', name: 'A', role: 'admin' },
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    ctrl.verify();
    sessionStorage.clear();
  });

  it('adds the bearer token to API requests', async () => {
    const p = firstValueFrom(http.get('http://api.test/api/admin/users'));
    const req = ctrl.expectOne('http://api.test/api/admin/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
    await p;
  });

  it('never sends the token to other hosts', async () => {
    const p = firstValueFrom(http.get('https://cdn.example.test/x.json'));
    const req = ctrl.expectOne('https://cdn.example.test/x.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await p;
  });

  it('signs out on 401 and redirects to login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const p = firstValueFrom(http.get('http://api.test/api/admin/users')).catch((e: unknown) => e);
    ctrl
      .expectOne('http://api.test/api/admin/users')
      .flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await p;
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
