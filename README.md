# Spend Remainder — Smart Expense Tracker

Spend Remainder is a full-stack expense tracker built on the existing Spring Boot + MySQL backend, with a React/Vite dashboard, budget management, statistical expense forecasting and an optional Gemini-powered budget advisor.

## Stack

- **Backend:** Java 17, Spring Boot 3.1.5, Spring Security, JWT, Spring Data JPA/Hibernate, Flyway, Maven
- **Database:** MySQL (local XAMPP or hosted Aiven MySQL)
- **Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Recharts
- **AI:** Deterministic monthly forecasting from the authenticated user's expense records; optional Google Gemini 2.5 Flash explanations for budget recommendations
- **Deployment:** Render (backend Dockerfile), Vercel (frontend)

## Repository layout

```text
expense_tracker/
├── src/main/java/...       # Existing Spring Boot application + AI insights
├── src/main/resources/     # application.properties + Flyway migrations
├── frontend/               # React/Vite application
├── Dockerfile
├── .env.example
├── PROJECT_ANALYSIS_AND_CHANGES.md
└── PROJECT_PROGRESS.md
```

## 1. Local setup

### Requirements

- Java 17+
- MySQL 8+ (XAMPP is fine)
- Node.js 20+
- npm

### Backend

1. Start MySQL in XAMPP and create a database named `expense_tracker` (or choose another name and update `DB_NAME`).
2. Copy `.env.example` to `.env` for reference. **Spring Boot does not automatically load `.env` files**; export the values in your terminal or configure them in your IDE run configuration.
3. Set local environment variables. Example for PowerShell:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="expense_tracker"
$env:DB_USERNAME="root"
$env:DB_PASSWORD=""
$env:DB_SSL_MODE="DISABLED"
$env:JWT_SECRET="replace-with-a-random-secret-of-at-least-32-bytes"
$env:FRONTEND_URL="http://localhost:5173"
$env:APP_TIME_ZONE="Asia/Kolkata"
```

4. Run the backend from this directory:

```powershell
.\mvnw.cmd spring-boot:run
```

On macOS/Linux use `./mvnw spring-boot:run` (or `bash ./mvnw spring-boot:run` if the executable bit is missing).

Flyway applies the versioned migrations automatically. Do not edit already-applied migration files; add a new migration for future schema changes.

### Frontend

```bash
cd frontend
cp .env .env.local
npm install
npm run dev
```

The frontend defaults to `http://localhost:8080` if `VITE_API_BASE_URL` is not set. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## 2. Existing API contract

All JSON endpoints (except where noted) use the wrapper `{ success, message, data, timestamp }`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a USER account |
| POST | `/api/auth/login` | Login; returns JWT and user summary |
| POST | `/api/auth/logout` | Client-side JWT logout acknowledgement |
| GET | `/api/users/profile` | Current user's profile |
| GET | `/api/expenses` | Current user's paginated expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/{id}` | Update own expense |
| DELETE | `/api/expenses/{id}` | Delete own expense |
| GET | `/api/expenses/total` | All-time expense total |
| GET | `/api/expenses/category-wise` | All-time category totals |
| GET | `/api/expenses/date-range?start=YYYY-MM-DD&end=YYYY-MM-DD` | Expense records in date range |
| GET | `/api/categories` | Categories |
| POST | `/api/budget/set?monthlyLimit=15000` | Set current-month budget |
| GET | `/api/budget` | Current-month budget |
| GET | `/api/budget/status` | Current-month budget status |
| GET | `/api/ai/prediction` | Next-month statistical forecast |
| POST | `/api/ai/budget-advisor` | Category allocation and budget advice; JSON body `{ "monthlyBudget": 15000 }` |

Authenticated endpoints require `Authorization: Bearer <token>`. The frontend Axios client adds this automatically.

## 3. AI insights

### Expense prediction

`GET /api/ai/prediction` uses the current authenticated user's six most recent completed calendar months. It forecasts the next month using the average of the last three completed months, both overall and per category. It also compares the two most recent completed months to describe the trend. This is a transparent statistical baseline, not a guaranteed prediction; sparse history produces weaker forecasts.

### Smart budget advisor

`POST /api/ai/budget-advisor` accepts a positive `monthlyBudget`. Category limits are allocated from the user's previous six completed months. A 10% savings target is reserved first; the remaining 90% is distributed according to historical category proportions. With no expense history, the spendable amount is divided equally among the default categories.

### Optional Gemini integration

Set `GEMINI_API_KEY` in the backend environment. The backend uses `gemini-2.5-flash` by default. Only summarized category totals and the proposed budget are sent to Gemini; raw transaction descriptions, email addresses, usernames, and tokens are not sent. If the key is absent or the API is unavailable, deterministic advice still returns and expense tracking remains operational.

Google currently lists a free tier for Gemini 2.5 Flash input/output tokens, subject to model/account rate limits and availability. Free-tier data-use terms differ from paid-tier terms; review Google's current terms before sending personal financial summaries. Pricing and quotas can change:

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits

## 4. Aiven MySQL configuration

Aiven currently documents a free MySQL tier with 1 CPU, 1 GB RAM and 1 GB storage on a single node. It has no high availability, a documented `max_connections` cap of 76, and may be powered off after extended inactivity; it is intended for learning, prototypes and small workloads rather than high-traffic production. Confirm the latest limits in Aiven's [free-tier documentation](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier) before relying on it.

In Aiven, create a MySQL service and database, then copy the connection details from its service overview. Configure the backend environment:

```env
DB_HOST=your-service-host.aivencloud.com
DB_PORT=your-service-port
DB_NAME=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=your-aiven-password
DB_SSL_MODE=REQUIRED
```

`sslMode=REQUIRED` encrypts the connection. If your Aiven service provides a CA certificate and you choose certificate/hostname verification, follow the exact JDBC truststore instructions supplied by Aiven rather than disabling TLS.

### Migrate XAMPP data without MySQL Workbench

Use the MySQL command-line tools bundled with XAMPP. In Windows, open **Command Prompt (cmd.exe)** (not PowerShell, because these examples use shell input/output redirection) and adjust the XAMPP path if needed:

```bat
cd /d C:\xampp\mysql\bin
mysqldump.exe -u root -p --single-transaction --routines --triggers --no-tablespaces expense_tracker > "%USERPROFILE%\Desktop\expense_tracker_backup.sql"
```

Then import into Aiven (the password prompt is safer than putting the password in the command):

```bat
mysql.exe --host=YOUR_AIVEN_HOST --port=YOUR_AIVEN_PORT --user=YOUR_AIVEN_USER --password --ssl-mode=REQUIRED YOUR_AIVEN_DATABASE < "%USERPROFILE%\Desktop\expense_tracker_backup.sql"
```

If your dump includes `CREATE DATABASE` / `USE expense_tracker` statements, either create/import into a database with that name or export without `--databases` and import into the selected Aiven database. Keep the dump private: it contains user emails and password hashes. Verify row counts before deleting or changing the local copy. The Flyway history table should be migrated with the data so the new V4 budget-index migration can run safely on startup.

For a brand-new empty Aiven database, do not import an old dump: set the connection variables and let Flyway create the schema.

## 5. Render backend deployment

1. Push the repository to GitHub without `.env` files or secrets.
2. Create a Render Web Service from the repository and select **Docker**. Set the root directory to `expense_tracker` if the repository contains a parent folder.
3. Add environment variables from the Aiven and security sections above. Set `APP_TIME_ZONE=Asia/Kolkata` (or your users’ intended business timezone) and `FRONTEND_URL` to the exact Vercel origin (for example `https://your-app.vercel.app`), `DB_SSL_MODE=REQUIRED`, and a strong random `JWT_SECRET`.
4. Render supplies `PORT`; the application and Docker entrypoint use it.
5. Set `GEMINI_API_KEY` only if Gemini explanations are wanted.

Never commit credentials. Rotate any secret that has ever been committed to Git history.

## 6. Vercel frontend deployment

1. Import the repository into Vercel.
2. Set the project root directory to `expense_tracker/frontend` (or `frontend` if that is already the repository root).
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com` (no trailing slash).
5. Redeploy after setting the variable. The included `vercel.json` rewrites client-side routes to `index.html`.
6. Ensure Render's `FRONTEND_URL` matches the deployed Vercel origin exactly.

## 7. Deployment configuration checklist

- Backend Dockerfile uses Java 17 and honors Render's `PORT`.
- MySQL credentials, JWT secret and Gemini key are environment variables.
- Aiven TLS is enabled with `DB_SSL_MODE=REQUIRED`.
- CORS allows only the configured frontend origin.
- Frontend API URL is configured at Vercel build time.
- `.env`, `.env.local`, `node_modules`, `dist` and Maven `target` are ignored by Git.

## 8. Current limitations / follow-up

- The existing backend has profile retrieval but no self-service profile update endpoint; the frontend profile screen is intentionally read-only rather than pretending an update succeeded.
- An admin workspace is included for the existing admin user and category endpoints.
- The project archive did not contain a `src/test` suite. Add controller/service tests before production use.
- A clean Maven build and npm production build must be run in an environment with Maven Central/npm registry access. The current execution environment could not download Maven or complete `npm install`; see `PROJECT_PROGRESS.md` for the exact verification status.
- Aiven, Render, Vercel and Gemini live requests require the user's credentials and cannot be validated from this source-only package.
