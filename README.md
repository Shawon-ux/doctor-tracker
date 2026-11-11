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

Prefer containers? Set `JWT_SECRET` in a `.env` file, then:

```bash
docker compose up --build -d
docker compose run --rm api node server/dist/scripts/seed.js
```

Detailed instructions for Windows and Linux are in [SETUP.md](SETUP.md).

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
