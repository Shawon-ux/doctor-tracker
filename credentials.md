# Credentials

Sign in at the app's login page.

| Role | Email | Password | Can do |
| --- | --- | --- | --- |
| Admin | `shawon@gmail.com` | `RottenTomato` | Everything: add, edit and delete doctors and patients |
| Restricted (viewer) | `test@gmail.com` | `Test1234` | Browse the dashboard, doctors and patients. No changes |

Seed defaults, created by `npm run seed` from `server/.env`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@doctortracker.dev` | `ChangeMe!2026` |
| Viewer | `viewer@doctortracker.dev` | `ViewOnly!2026` |

A fresh database only has the seed accounts. To create the first two on any database:

```bash
npm run create-user -- shawon@gmail.com RottenTomato admin Shawon
npm run create-user -- test@gmail.com Test1234 viewer Test User
```

Running it for an email that already exists resets that user's password and role.

This file holds plain-text passwords. Do not publish it with a public repository.
