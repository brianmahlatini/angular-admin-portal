import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { adminGuard } from './core/guards';

@Component({ selector: 'app-forbidden', template: '<h1>Forbidden</h1><p>You need the admin role to use this portal.</p>' })
class ForbiddenPage {}

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.page').then((m) => m.LoginPage), title: 'Sign in' },
  { path: 'users', canActivate: [adminGuard], loadComponent: () => import('./users/users.page').then((m) => m.UsersPage), title: 'Users' },
  { path: 'forbidden', component: ForbiddenPage, title: 'Forbidden' },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '**', redirectTo: 'users' },
];
