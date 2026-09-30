import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { describeError } from '../core/api';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  template: `
    <form class="card" [formGroup]="form" (ngSubmit)="submit()" aria-label="Admin sign in">
      <h1>Admin sign in</h1>
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <label
        >Email
        <input type="email" formControlName="email" autocomplete="email" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <span class="field-error">Enter a valid email address.</span>
        }
      </label>
      <label
        >Password
        <input type="password" formControlName="password" autocomplete="current-password" />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <span class="field-error">Password is required.</span>
        }
      </label>
      <button type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
    </form>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      if (!this.auth.isAdmin()) {
        this.auth.logout(false);
        this.error.set('This portal is for administrators only.');
        return;
      }
      await this.router.navigate(['/users']);
    } catch (e) {
      this.error.set(describeError(e).message);
    } finally {
      this.busy.set(false);
    }
  }
}
