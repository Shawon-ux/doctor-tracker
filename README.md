# Doctor Tracker

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

An admin portal for clinics that keeps every doctor, their patients and current clinical load in one place. Admins register doctors, assign and update patients, and see at a glance who is critical, which doctors carry the most load and how admissions are trending, all behind a secured sign-in.

![Overview](docs/screenshots/desktop-overview.png)

## Features

- Doctor and patient management with full CRUD, search and filters
- Dashboard with admissions and releases trends, custom date ranges and clickable charts
- Release and readmit workflow with length-of-stay tracking
- Role-based access: `admin` (full) and `viewer` (read-only)
- Ctrl+K global search, dark mode, and shareable URL-driven filters
- Secure sessions: httpOnly cookies, CSRF protection, rate-limited login

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | Next.js 16, React 19, TanStack Query, Tailwind CSS 4, Recharts |
| API | Node.js 20+, Express 5, Zod, JWT, Pino |
| Database | MongoDB 7 with Mongoose 9 |
| Quality | TypeScript, ESLint, Vitest, Supertest, GitHub Actions |

## Getting started

**Requirements:** Node.js 20.12+, npm 10+, and MongoDB 7 (or Docker).

```bash
npm install
cp server/.env.example server/.env          # Windows: Copy-Item
cp client/.env.example client/.env.local
npm run secret                              # set the output as JWT_SECRET in both files
npm run seed
npm run dev
```

Open http://localhost:3000. Demo logins are listed in [credentials.md](credentials.md).

Prefer containers? Copy `.env.example` (repo root) to `.env`, set `JWT_SECRET` in it, then:

```bash
docker compose up --build -d
docker compose run --rm api node server/dist/scripts/seed.js
```

Detailed instructions for Windows and Linux are in [SETUP.md](SETUP.md).

## System architecture

```
 Browser
   │  same origin only: pages + /api/*  (httpOnly session cookie, SameSite=Lax)
   ▼
 Next.js client  :3000
   ├─ proxy.ts        verifies the session JWT, redirects signed-out users to /login
   ├─ App Router      Overview, Doctors, Doctor detail, Patients, Login
   ├─ TanStack Query  server cache, URL-driven filters, optimistic deletes
   └─ rewrite         /api/:path*  ──►  API_URL/api/v1/:path*
                                           │
                                           ▼
 Express API  :4000  (separate, standalone service)
   ├─ helmet, JSON size limit, pino logging
   ├─ csrfGuard       Origin allow-list + X-Requested-With on writes
   ├─ /auth           login (rate limited), logout (revokes), me
   ├─ requireAuth     every role reads; writes need admin
   └─ /doctors  /patients  /stats    CRUD, search, filters, dashboard aggregations
                                           │
                                           ▼
 MongoDB   users, doctors, patients (indexed)
```

**Data flow:** a page reads its filters from the URL, TanStack Query calls `/api/...` on the same origin, Next forwards it to Express, Express validates the input with Zod, runs an index-backed query and returns `{ items, page, limit, total, pages }`. Writes invalidate the related list and stats caches. The full API table is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technical decisions

### 1. One origin for the browser, two services behind it

Calling the API directly from the browser would make the session cookie cross-site: `SameSite=None`, credentialed CORS and weaker CSRF protection. Instead, Next.js forwards `/api/*` to Express, so the browser only talks to one origin and the JWT sits in an **httpOnly, SameSite=Lax** cookie that scripts cannot read. Express stays a standalone service that can be scaled or deployed on its own, and it still checks the `Origin` header plus a custom header on every write. Sessions carry a `tokenVersion`, so signing out revokes the token on the server too. *Trade-off:* one extra hop through Next, which is far cheaper than handling cross-site cookies.

### 2. Index-friendly search, with the URL as the state store

An unanchored or case-insensitive `$regex` scans the whole collection, and `$text` cannot match partial words. Each doctor and patient stores a lowercased `keywords` array with a multikey index, and a query like `far kab` becomes `{ keywords: { $all: [/^far/, /^kab/] } }`. Anchored prefixes turn into index range scans, so results appear as you type. Compound indexes match the real access paths (`{doctor, admittedAt, _id}`, `{condition, admittedAt, _id}`, `{admittedAt, _id}`), and every sort adds `_id` as a tiebreaker so pages never repeat or skip rows. On the client, filters, search, sort and page live in the URL, so every view can be bookmarked and the back button works. TanStack Query owns the rest of the server state. More detail and the query plans: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/query-plans.md](docs/query-plans.md).

## Visual evidence

| Desktop | Mobile |
| --- | --- |
| ![Overview](docs/screenshots/desktop-overview.png) | ![Overview mobile](docs/screenshots/mobile-overview.png) |
| ![Doctors](docs/screenshots/desktop-doctors.png) | ![Doctors mobile](docs/screenshots/mobile-doctors.png) |
| ![Doctor detail](docs/screenshots/desktop-doctor.png) | ![Patients mobile](docs/screenshots/mobile-patients.png) |
| ![Patients](docs/screenshots/desktop-patients.png) | ![Login mobile](docs/screenshots/mobile-login.png) |

Dark mode, the Ctrl+K search and the read-only viewer view: [dark overview](docs/screenshots/desktop-overview-dark.png), [command palette](docs/screenshots/desktop-command.png), [viewer](docs/screenshots/desktop-viewer.png).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and client in watch mode |
| `npm run build` / `npm start` | Production build and run |
| `npm run seed` | Create users and demo data |
| `npm run create-user` | Create or reset a user |
| `npm test` | API integration tests and client unit tests |
| `npm run ci` | Lint, typecheck, test and build |

## Configuration

Environment variables are documented in `server/.env.example` and `client/.env.example`. `JWT_SECRET` must be identical in both apps.

## Documentation

- [Setup guide](SETUP.md)
- [Architecture, API, security and testing](docs/ARCHITECTURE.md)
- [Database query plans](docs/query-plans.md)

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
