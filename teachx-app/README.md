# TeachX (standalone frontend)

Teachers-only Next.js app that **proxies all `/api/*` traffic** to the ClassteacherAI backend. Same database and JWT secret as the main app when using server-side session checks.

## Local development

1. Start the **main** ClassteacherAI app on port **3000** (`npm run dev` in repo root).
2. Copy env: `cp .env.example .env.local` and set `DATABASE_URL`, `JWT_SECRET` (same values as main app), `BACKEND_URL=http://127.0.0.1:3000`, `NEXT_PUBLIC_MAIN_APP_URL=http://127.0.0.1:3000`.
3. From `teachx-app/`: `npm install` then `npm run dev` (port **3001**).

Open http://localhost:3001 — signup uses header `X-Signup-Source: teachx` (already set) so the API creates **TEACHER** accounts.

## Production (Railway)

### Option A — Two services (recommended)

| Service        | Root directory | Start command        | Env |
|----------------|----------------|----------------------|-----|
| **classteacher** | `/` (default)  | `npm run start`      | Full app env |
| **teachx**     | `teachx-app`   | `npm run start`      | `BACKEND_URL` = public HTTPS URL of classteacher service, `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_MAIN_APP_URL` = classteacher public URL |

Set Railway **Watch paths** so the TeachX service only rebuilds when `teachx-app/**` changes (optional).

### Option B — Same domain (advanced)

Terminate TLS at one reverse proxy and route hostnames: `teachx.example.com` → TeachX service, `app.example.com` → main app. Cookies stay host-scoped; use consistent `JWT_SECRET` on both.

## Scripts

- `npm run dev` — Next dev on 3001
- `npm run build` — `prisma generate` (parent schema) + `next build`
- `npm run start` — production server (set `PORT` in production)

## Folder layout

```
teachx-app/
  src/app/           # Routes: /, /login, /signup, /dashboard, /pricing, /business/...
  src/components/    # TeachX + Nexa UI
  src/lib/           # Auth, prisma, TeachX helpers (minimal copy)
  next.config.ts     # rewrites /api → BACKEND_URL
```

OpenAI keys stay on the **backend** only; this app does not call OpenAI directly.

## Prisma schema copy

`teachx-app/prisma/schema.prisma` is a **copy** of the root schema so `prisma generate` outputs into `teachx-app/node_modules`. After you change the root schema or run migrations, refresh the copy:

```bash
cp prisma/schema.prisma teachx-app/prisma/schema.prisma
```

(Use the equivalent on Windows.)
