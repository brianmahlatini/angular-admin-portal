import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, User } from './api';

interface Session {
  token: string;
  user: User;
}

const KEY = 'admin-portal.session';

/** Signal-based session store. Components read `user()` / `isAdmin()`; nothing subscribes manually. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);
  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly token = computed(() => this.session()?.token ?? null);

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<Session>(`${this.base}/api/auth/login`, { email, password }),
    );
    this.set(res);
  }

  logout(redirect = true): void {
    this.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  private set(next: Session | null): void {
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
    this.session.set(next);
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}
