# Project Analysis and Changes

## Phase 1 — Existing project inspection

### Project structure
- Existing project root: `JAVA_PROJECT/expense_tracker`
- Backend: Java 17, Spring Boot 3.1.5, Maven
- Persistence: Spring Data JPA / Hibernate, MySQL Connector/J
- Schema migration: Flyway (`V1`–`V3`)
- Security: Spring Security, stateless JWT, BCrypt
- Existing frontend: none found in the uploaded project
- Existing automated tests: no `src/test` files found
- Existing compiled `target/` output and a `.git/` directory were included in the ZIP; these are build/repository artifacts, not source.

### Existing domain model
- `User`: username, name, email, password, role
- `Category`: name, description
- `Expense`: amount, date, description, owning user, category
- `Budget`: monthlyLimit, month, owning user

### Existing API inventory (confirmed from controller annotations)

| Method | Endpoint | Access / purpose |
|---|---|---|
| POST | `/api/auth/register` | Public registration |
| POST | `/api/auth/login` | Public login; returns JWT response |
| POST | `/api/auth/logout` | Public JWT client-side logout acknowledgement |
| GET | `/api/users/profile` | Authenticated profile |
| GET | `/api/users/{username}` | Authenticated; service/controller restricts viewing to self except admin |
| GET | `/api/expenses` | Authenticated, paginated expense list |
| POST | `/api/expenses` | Authenticated, create expense |
| PUT | `/api/expenses/{id}` | Authenticated, update own expense |
| DELETE | `/api/expenses/{id}` | Authenticated, delete own expense |
| GET | `/api/expenses/total` | Authenticated total |
| GET | `/api/expenses/category-wise` | Authenticated category totals |
| GET | `/api/expenses/date-range?start=YYYY-MM-DD&end=YYYY-MM-DD` | Authenticated date filter |
| GET | `/api/expenses/date-range/paginated` | Authenticated paginated date filter |
| GET | `/api/categories` | Public category list |
| GET | `/api/categories/{id}` | Public category detail |
| POST | `/api/categories` | Admin-only category creation |
| POST | `/api/budget/set?monthlyLimit=...` | Authenticated current-month budget |
| GET | `/api/budget` | Authenticated current-month budget |
| GET | `/api/budget/status` | Authenticated budget status |
| GET | `/api/admin/users` | Admin-only users list |
| GET | `/api/admin/users/{id}` | Admin-only user detail |
| PUT | `/api/admin/users/{id}` | Admin-only user update |
| PUT | `/api/admin/users/{id}/role?role=...` | Admin-only role update |
| DELETE | `/api/admin/users/{id}` | Admin-only user deletion |

The API wraps most payloads in `ApiResponse` with `success`, `message`, `data`, and timestamp/error fields. The paginated endpoints return Spring `Page` data inside `data`.

### Important findings / risks before feature work

1. **Registration role escalation:** `UserService.registerUser` accepts `role=ADMIN` from a public registration request. Public registration must always create `USER`; admin promotion must remain an admin-only action.
2. **JWT secret is hardcoded:** `application.properties` currently contains a fixed JWT secret. It must become an environment variable with a safe local-development default or explicit required production setting.
3. **Budget schema mismatch:** `Budget` has `@OneToOne` with `User`, and V1 has a unique constraint on `budgets.user_id`, but the service looks up budgets by `(user, month)`. This means the intended one-budget-per-user-per-month behavior conflicts with the schema. A migration is needed to make `(user_id, month)` unique and permit multiple months.
4. **Budget total calculation:** `ExpenseService.getTotalExpenses` sums all-time expenses, while the budget is month-specific. Budget status should sum expenses only within the selected month.
5. **Sensitive entity serialization:** Some controllers return `User` entities directly. `password` is `@JsonIgnore`, but API responses should preferably use DTOs to avoid exposing internal entity relationships and role-management fields.
6. **Admin seed migration:** V3 inserts a placeholder BCrypt hash (`YourHashedPasswordHere`), not a usable password hash. Do not rely on this seeded account for deployment.
7. **CORS not configured:** Security configuration has no explicit frontend-origin CORS policy.
8. **Verbose debug logging:** SQL display and DEBUG logging are enabled in the current properties; production should disable them.
9. **Expense pagination input validation:** page/size/sort parameters are passed into `PageRequest` / `Sort` without bounds or sort-field allowlisting.
10. **No frontend or tests:** The archive contains no React frontend and no source test files.
11. **Existing database configuration:** `application.properties` already uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` and `sslMode=REQUIRED`; this is a useful starting point, but needs local defaults/profile handling, production validation and env documentation.

### Build/test baseline
- Java runtime available in this environment: OpenJDK 21 (project targets Java 17).
- `./mvnw` initially could not execute because its executable bit is not set; invoking it through `bash ./mvnw` reaches Maven Wrapper.
- Maven Wrapper attempted to download Maven 3.9.14 from Maven Central, but the download failed in this execution environment. Therefore a clean Maven build has **not** been verified yet. No test suite was present under `src/test`.
- No Aiven or Gemini credentials were supplied, so external database / AI connectivity cannot be tested yet.

## Planned implementation approach
- Preserve existing entities and endpoints unless a documented correctness/security fix requires a migration or additive endpoint.
- Add AI endpoints in Spring Boot that derive summaries only from the authenticated user's own records.
- Keep forecasting deterministic and statistical; treat Gemini as an optional explanation/advisor layer, never as a prerequisite for expense CRUD.
- Build the React UI against the inspected API contract, not invented mock endpoints.
- Keep all credentials out of source control and package only `.env.example` templates.

## Phase 2 — Backend fixes and AI services

Implemented in the working tree:
- Public registration now always creates `USER`; a caller-supplied `role=ADMIN` is ignored. Admin promotion remains available only through the admin-only route.
- Login failures return a generic authentication error rather than echoing internal exception details.
- JWT secret, expiry, database connection, frontend origin, timezone and Gemini configuration are environment-driven.
- Added explicit single-origin CORS configuration for the Vite/Vercel frontend.
- Corrected monthly budget persistence to support one budget per user per month. `Budget` is now many-to-one with `User`; Flyway V4 adds a `(user_id, month)` unique index while preserving the FK-supporting index.
- Budget status now compares the current month's expenses with the current month's budget, not all-time expenses.
- Expense API responses now include the category object (the category's reverse expense collection remains ignored), enabling category labels in the UI.
- Added authenticated `GET /api/ai/prediction` and `POST /api/ai/budget-advisor` endpoints. Both derive summaries from the authenticated user's own records.
- Forecasting uses the average of the last three completed calendar months, with category forecasts and a recent trend comparison. Budget advice reserves 10% for savings and allocates the remainder using historical category proportions.
- Gemini is optional (`GEMINI_API_KEY`); it receives aggregate category totals and a proposed budget only. Calls have bounded connect/read timeouts. If Gemini is absent or unavailable, deterministic advice still returns.

## Phase 3 — React frontend

Added `frontend/` with React 18 + Vite, React Router, Axios, Tailwind CSS and Recharts. Implemented:
- Registration and login with JWT storage and Axios authorization interceptor.
- Protected application routes and role-protected admin route.
- Responsive dashboard using actual current-month expense records, category breakdown, recent expenses, budget and forecast.
- Expense list with pagination, search within the loaded page, add/edit/delete forms and validation.
- Monthly budget view and update form.
- AI insights screen with prediction chart and budget advisor.
- Read-only profile view because no self-service profile update API exists.
- Admin workspace for the existing admin user-management and category-creation APIs.
- Empty/loading/error states; no fake transaction or successful API data.

## Phase 4 — Frontend/backend integration

The Axios client uses `VITE_API_BASE_URL`, reads the JWT from local storage and unwraps the existing `ApiResponse.data` envelope. Frontend calls were matched to controller mappings discovered in Phase 1; AI routes are the only new routes. Expense JSON now includes its category relation so the UI can show the category name.

## Phase 5 — Deployment preparation

Added backend Dockerfile (Java 17), `render.yaml`, Vercel SPA rewrite config, frontend/backend `.env.example` files, `.dockerignore`, and updated `.gitignore`. Aiven uses the MySQL connector's `sslMode` property, with local `DISABLED` and production `REQUIRED` settings. README includes XAMPP-to-Aiven CLI migration instructions and Render/Vercel configuration.

## Phase 6 — Verification status

- Static Node syntax checks passed for Vite, Tailwind, PostCSS and Axios configuration files.
- Global TypeScript compiler parsed the JSX/JS source files with JSX enabled and no diagnostics (this is a syntax parse, not a dependency-aware typecheck or production build).
- `npm install --no-audit --no-fund` did not complete before the execution timeout. Consequently `npm run build` could not run: Vite is not installed (`vite: not found`).
- `bash ./mvnw clean package -DskipTests` was attempted; Maven Wrapper could not download Maven 3.9.14 from Maven Central in this environment. There is no system `mvn` executable and no Maven distribution cached locally.
- No `src/test` suite was included in the uploaded archive.
- No MySQL/Aiven credentials, running database, Gemini key, Render service or Vercel project were supplied; live database, AI and deployment checks remain unverified.
