import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, PageMeta, Role, User } from '../core/api';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(page: number, perPage = 20): Observable<{ data: User[]; meta: PageMeta }> {
    const params = new HttpParams().set('page', page).set('per_page', perPage);
    return this.http.get<{ data: User[]; meta: PageMeta }>(`${this.base}/api/admin/users`, {
      params,
    });
  }

  setRole(id: number, role: Role): Observable<{ user: User }> {
    return this.http.patch<{ user: User }>(`${this.base}/api/admin/users/${id}`, { role });
  }
}
