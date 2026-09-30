import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PageMeta, Role, User, describeError } from '../core/api';
import { AuthService } from '../core/auth.service';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users-page',
  imports: [DatePipe],
  template: `
    <h1>Users</h1>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
    }
    @if (loading()) {
      <p aria-busy="true">Loading…</p>
    } @else {
      <table>
        <caption>
          {{
            meta()?.total ?? 0
          }}
          users
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Joined</th>
            <th scope="col">Role</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.created_at | date: 'mediumDate' }}</td>
              <td>
                <select
                  [attr.aria-label]="'Role for ' + u.email"
                  [value]="u.role"
                  [disabled]="saving() === u.id"
                  (change)="changeRole(u, $any($event.target).value)"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
                @if (u.id === me()?.id) {
                  <span class="you">(you)</span>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4">No users.</td>
            </tr>
          }
        </tbody>
      </table>
      <nav aria-label="Pagination">
        <button (click)="go(page() - 1)" [disabled]="page() <= 1">Previous</button>
        <span>Page {{ page() }} of {{ meta()?.total_pages || 1 }}</span>
        <button (click)="go(page() + 1)" [disabled]="page() >= (meta()?.total_pages ?? 1)">
          Next
        </button>
      </nav>
    }
  `,
})
export class UsersPage {
  private readonly api = inject(UsersService);
  readonly me = inject(AuthService).user;

  readonly users = signal<User[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly saving = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly adminCount = computed(() => this.users().filter((u) => u.role === 'admin').length);

  constructor() {
    void this.load();
  }

  async go(page: number): Promise<void> {
    this.page.set(page);
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.list(this.page()));
      this.users.set(res.data);
      this.meta.set(res.meta);
    } catch (e) {
      this.error.set(describeError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  async changeRole(user: User, role: Role): Promise<void> {
    if (role === user.role) return;
    if (
      user.id === this.me()?.id &&
      role === 'member' &&
      !confirm('Remove your own admin access? You will lose access to this page.')
    ) {
      this.users.update((list) => [...list]); // re-render the select back to its old value
      return;
    }
    const previous = this.users();
    this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u))); // optimistic
    this.saving.set(user.id);
    this.error.set(null);
    try {
      const { user: saved } = await firstValueFrom(this.api.setRole(user.id, role));
      this.users.update((list) => list.map((u) => (u.id === saved.id ? saved : u)));
    } catch (e) {
      this.users.set(previous); // roll back, e.g. 409 "Cannot demote the last remaining admin."
      this.error.set(describeError(e).message);
    } finally {
      this.saving.set(null);
    }
  }
}
