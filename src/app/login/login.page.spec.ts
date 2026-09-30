import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { API_BASE_URL } from '../core/api';
import { AuthService } from '../core/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let ctrl: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });
    ctrl = TestBed.inject(HttpTestingController);
    return TestBed.createComponent(LoginPage);
  }

  afterEach(() => {
    ctrl.verify();
    sessionStorage.clear();
  });

  it('does not call the API with an invalid form', async () => {
    const fixture = setup();
    await fixture.componentInstance.submit();
    await fixture.whenStable();
    ctrl.expectNone('http://api.test/api/auth/login');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Enter a valid email address.',
    );
  });

  it('signs an admin in and navigates to users', async () => {
    const fixture = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      email: 'admin@example.test',
      password: 'secret-password',
    });
    const p = fixture.componentInstance.submit();
    ctrl.expectOne('http://api.test/api/auth/login').flush({
      token: 't',
      user: { id: 1, email: 'admin@example.test', name: 'Admin', role: 'admin' },
    });
    await p;
    expect(navigate).toHaveBeenCalledWith(['/users']);
  });

  it('refuses members even with valid credentials', async () => {
    const fixture = setup();
    fixture.componentInstance.form.setValue({
      email: 'bob@example.test',
      password: 'secret-password',
    });
    const p = fixture.componentInstance.submit();
    ctrl.expectOne('http://api.test/api/auth/login').flush({
      token: 't',
      user: { id: 2, email: 'bob@example.test', name: 'Bob', role: 'member' },
    });
    await p;
    expect(TestBed.inject(AuthService).user()).toBeNull();
    expect(fixture.componentInstance.error()).toBe('This portal is for administrators only.');
  });

  it('shows the API error message', async () => {
    const fixture = setup();
    fixture.componentInstance.form.setValue({ email: 'x@example.test', password: 'wrong' });
    const p = fixture.componentInstance.submit();
    ctrl
      .expectOne('http://api.test/api/auth/login')
      .flush(
        { title: 'Unauthorized', detail: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await p;
    expect(fixture.componentInstance.error()).toBe('Invalid email or password.');
  });
});
