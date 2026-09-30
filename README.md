# angular-admin-portal

An Angular 21 admin portal for [php-rest-api](https://github.com/brianmahlatini/php-rest-api). Administrators can sign in, browse users with pagination, and promote or demote roles with optimistic updates. It's built on current Angular: **standalone components, signals, zoneless change detection, functional interceptors and guards, lazy-loaded routes, and the new control-flow syntax**, with unit tests on Vitest. It deploys to **Azure Static Web Apps**.

```
$ npm run test:ci
Test Files  4 passed    Tests  14 passed
```

## Structure

| Path | Responsibility |
|---|---|
| `core/auth.service.ts` | Signal-based session: `user()`, `isAdmin()`, `token()` computed from one source of truth |
| `core/auth.interceptor.ts` | Functional interceptor: bearer token on API calls only; 401 → sign out |
| `core/guards.ts` | `adminGuard` (UX only; the API enforces roles on every request) |
| `users/` | `UsersService` (typed HTTP) and `UsersPage` (table, pagination, optimistic role changes with rollback) |
| `login/` | Reactive form with validation; rejects non-admin accounts after sign-in |
| `public/staticwebapp.config.json` | SPA fallback, CSP and security headers, immutable asset caching |

## Design decisions and trade-offs

- **Signals over RxJS for state.** Component and session state are signals, so the templates are plain reads with no `async` pipes or manual subscriptions to leak. RxJS stays where it fits (HTTP) and is converted at the boundary with `firstValueFrom`.
- **Zoneless.** No zone.js means change detection runs only when a signal changes: smaller bundles and predictable rendering. The tests use `whenStable()` accordingly.
- **The token never leaves our API.** The interceptor attaches `Authorization` only to requests for `API_BASE_URL`, so a call to a CDN or third-party service can't leak the token. A test covers this.
- **Guards are for UX, not security.** The route guard just keeps members out of screens they can't use. Real enforcement is the API's `RequireRole` middleware, and the README says so.
- **Admin safety rails in the UI too.** Removing your own admin role asks for confirmation. If the API refuses the last-admin demotion (HTTP 409), the change rolls back and the server's reason is shown.
- **Lazy routes.** The login and users pages are separate chunks, so the initial bundle only carries the shell.
- **Config per environment.** The API URL is injected through an `InjectionToken` from `environment.ts`, swapped at build time for production. Nothing is hard-coded in components.

## Run

```sh
npm ci
npx ng serve                 # http://localhost:4200, API expected on :8080
npm run test:ci
npx ng build --configuration production
```

## CI/CD

Prettier check, unit tests, `npm audit`, and a production build on every push. On `main`, when `AZURE_SWA_ENABLED` is set, the build artifact is deployed to Azure Static Web Apps with the deployment token stored as an encrypted secret.

## License

MIT
