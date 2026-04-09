# ClassteacherAI

Production-ready Next.js (App Router) app with:
- JWT auth (teacher/student)
- Nexa AI chat (OpenAI, streaming)
- Razorpay subscriptions and credits
- PostgreSQL + Prisma

## Local development

1. Copy env file:
```bash
cp .env.example .env
```
2. Install deps:
```bash
npm install
```
3. Apply database migrations:
```bash
npx prisma migrate dev
```
4. Start app:
```bash
npm run dev
```

## Required environment variables

Set all values from `.env.example`:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`

## Railway deployment (frontend + backend together)

This app deploys as a single Railway service (Next.js server handles both UI and API routes).

### 1) Create Railway project
- Connect repo to Railway.
- Railway auto-detects `railway.json`.

### 2) Add Postgres on Railway
- Add Railway Postgres plugin.
- Copy generated connection string into `DATABASE_URL`.

### 3) Configure env variables in Railway
- Add all required env vars listed above.
- Use production keys for OpenAI, Brevo, and Razorpay.

### 4) Deploy
- Railway will run install/build.
- Start command runs:
  - `prisma migrate deploy`
  - `next start -p $PORT`

### 5) Configure Razorpay webhook
- Endpoint: `https://<your-railway-domain>/api/payments/webhook`
- Event subscriptions:
  - `payment.captured`
  - `payment.failed`
- Set webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

## Health and operations

- Health check endpoint: `/api/health`
- Railway healthcheck is configured to use this endpoint.

## Post-deploy verification checklist

### Auth
- Sign up as Teacher and Student.
- Login and verify role redirects:
  - Teacher -> `/teacher/dashboard`
  - Student -> `/student/dashboard`
- Verify protected routes redirect unauthenticated users to `/auth/login`.

### Payments
- Open `/pricing` and buy a plan using Razorpay test mode.
- Open `/credits` and buy a credit pack.
- Confirm:
  - user `plan` updates
  - user `credits` increments
  - `Transaction` row status becomes `PAID`
- Trigger webhook event and confirm idempotent updates.

### AI
- Open `/nexa`.
- Send prompt and verify streaming response.
- Verify conversation and messages persist in DB.

## Useful commands

```bash
npm run lint
npm run build
npm run migrate:deploy
```
