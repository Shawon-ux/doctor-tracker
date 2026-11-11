# Local setup

These steps run the API (port 4000) and the web client (port 3000) on **Windows 10/11** or **Linux**. Commands are given for each shell where they differ. Everything else runs the same in both.

## 1. Prerequisites

| | Windows | Linux |
| --- | --- | --- |
| Node.js 20.12+ (22 LTS recommended) | Installer from [nodejs.org](https://nodejs.org) | [nodejs.org](https://nodejs.org), `nvm`, or your package manager |
| npm 10+ | Ships with Node | Ships with Node |
| MongoDB 7 | See step 2 | See step 2 |

Check versions:

```bash
node -v
npm -v
```

## 2. MongoDB

Pick one option.

**A. Docker** (Docker Desktop on Windows, Docker Engine on Linux)

```bash
docker run -d --name doctor-tracker-mongo -p 27017:27017 -v doctor-tracker-data:/data/db mongo:7
```

**B. Native install**

- Windows: install [MongoDB Community Server](https://www.mongodb.com/try/download/community) (MSI) and keep "Install as a Service" ticked. It starts on boot.
- Linux: follow the [official guide](https://www.mongodb.com/docs/manual/administration/install-on-linux/) for your distro, then run `sudo systemctl enable --now mongod`.

**C. MongoDB Atlas** (no local install)

Create a free cluster, allow your IP, and copy the `mongodb+srv://...` connection string for step 4.

## 3. Install

From the project root:

```bash
npm install
```

This installs both apps (npm workspaces).

## 4. Configure

Copy the example env files.

Linux (bash):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Windows (PowerShell):

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env.local
```

Generate a secret:

```bash
npm run secret
```

Open both files and set:

| File | Key | Value |
| --- | --- | --- |
| `server/.env` | `JWT_SECRET` | the generated secret |
| `server/.env` | `MONGODB_URI` | keep the default for options A and B, or paste the Atlas string |
| `server/.env` | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the first admin login (password 10+ characters) |
| `client/.env.local` | `JWT_SECRET` | **the same secret** as the server |

## 5. Seed

```bash
npm run seed
```

This creates the admin user, a read-only viewer (if `VIEWER_EMAIL` and `VIEWER_PASSWORD` are set), 28 doctors and 1,600 patients. Add more users at any time:

```bash
npm run create-user -- someone@clinic.org 'StrongPass123' admin "Their Name"
``` To wipe existing doctors and patients and reseed:

```bash
npm run seed -- --reset
```

## 6. Run

**Development** (hot reload, both apps in one terminal):

```bash
npm run dev
```

Open http://localhost:3000 and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Defaults: `admin@doctortracker.dev` / `ChangeMe!2026`.

**Production build, run locally:**

```bash
npm run build
npm start
```

Stop either one with `Ctrl+C`.

## 7. Verify

```bash
npm test        # API integration tests (in-memory MongoDB) and client unit tests
npm run ci      # lint, typecheck, tests, build
```

The first test run downloads a MongoDB binary of about 100 MB.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Windows: `npm.ps1 cannot be loaded because running scripts is disabled` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use Command Prompt |
| `Invalid environment: JWT_SECRET ...` | `server/.env` is missing or the secret is under 32 characters |
| `MongoServerSelectionError` / `ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running. Docker: `docker start doctor-tracker-mongo`. Windows service: `net start MongoDB`. Linux: `sudo systemctl start mongod` |
| Port 3000 already in use | Next picks the next free port and prints it (e.g. `Local: http://localhost:3002`). Open that URL. Any localhost port is accepted in development |
| Port 4000 already in use | Set `PORT` in `server/.env` and `API_URL` in `client/.env.local` to match |
| Signed in, but sent straight back to the login page | `JWT_SECRET` differs between `server/.env` and `client/.env.local` |
| `403 Request origin not allowed` on save | Opened via a LAN IP or hostname instead of `localhost`. Add that origin to `CLIENT_ORIGIN` in `server/.env` |
| Changed `API_URL` but nothing changed | It is read at build time. Restart `npm run dev` or rebuild |
