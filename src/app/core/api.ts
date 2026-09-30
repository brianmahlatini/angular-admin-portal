import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export type Role = 'member' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  created_at?: string;
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Normalises the API's RFC 7807 problem details (or a network failure) into something a form can show. */
export function describeError(err: unknown): { message: string; fields: Record<string, string[]> } {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return { message: 'Could not reach the server.', fields: {} };
    const p = (err.error ?? {}) as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    return {
      message: p.detail || p.title || `Request failed (${err.status})`,
      fields: p.errors ?? {},
    };
  }
  return { message: 'Something went wrong.', fields: {} };
}
