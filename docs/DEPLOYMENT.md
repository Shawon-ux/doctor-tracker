# Deployment: API on Render, web on Vercel

Browser → **Vercel** (Next.js) → rewrite `/api/*` → **Render** (Express) → **MongoDB Atlas**.
The browser only talks to the Vercel domain, so the session cookie stays first-party and no CORS setup is needed.

Deploy the API first, then the web app (it needs the API's URL at build time).

## 0. Generate one secret

```bash
npm run secret
```

Use the same value as `JWT_SECRET` on both Render and Vercel.

## 1. MongoDB Atlas

1. Create a free cluster, then a database user.
2. Network Access: allow `0.0.0.0/0` (Render's IPs change).
3. Copy the connection string and add the database name:
   `mongodb+srv://USER:PASS@cluster.mongodb.net/doctor-tracker?retryWrites=true&w=majority`

## 2. Render (API)

New → **Web Service** → connect the GitHub repo (or New → Blueprint, which reads `render.yaml`).

| Setting | Value |
| --- | --- |
| Runtime | Docker |
| Dockerfile path | `./server/Dockerfile` |
| Docker build context | `.` (repo root) |
| Health check path | `/health` |

Environment variables:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | the secret from step 0 |
| `CLIENT_ORIGIN` | your Vercel URL, no trailing slash (set after step 3, then redeploy) |
| `TRUST_PROXY` | `2` |

After it deploys, open `https://YOUR-API.onrender.com/health`. You should see `{"status":"ok","db":true}`.

## 3. Vercel (web)

New Project → import the same repo.

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework | Next.js |

Environment variables (set **before** the first deploy, because `API_URL` is read at build time):

| Key | Value |
| --- | --- |
| `API_URL` | `https://YOUR-API.onrender.com` |
| `JWT_SECRET` | the same secret as Render |

Deploy, copy the Vercel URL, put it in Render's `CLIENT_ORIGIN`, and let Render redeploy.

## 4. Seed the production database (once)

From your PC, in `server/.env`, temporarily set `MONGODB_URI` to the Atlas string, then:

```bash
npm run seed
```

Change `MONGODB_URI` back afterwards. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`, then change that password.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `403 Request origin not allowed` on save | `CLIENT_ORIGIN` on Render does not exactly match the Vercel URL (use `https://`, no trailing slash). Preview URLs need to be added, comma separated |
| Signed in, then bounced to login | `JWT_SECRET` differs between Render and Vercel, or the API is not on `NODE_ENV=production` over HTTPS |
| Pages load but data calls 404 or 500 | `API_URL` was wrong or unset at build time. Fix it on Vercel and **redeploy** (it is baked in at build) |
| First request after idle is slow or times out | Render's free plan sleeps. Wait about 30 seconds and retry, or use a paid plan |
| "Too many sign-in attempts" for everyone | `TRUST_PROXY` is too low, so all users look like one IP. Use `2` (Vercel + Render) and raise it if your setup adds another proxy |
| Render build fails to find `tsc` | Use the Docker runtime above. A plain Node build with `NODE_ENV=production` skips dev dependencies |
