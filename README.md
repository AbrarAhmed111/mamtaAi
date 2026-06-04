# MamtaAI

MamtaAI is an AI-powered baby care platform that helps families track activities, manage caregiver access, receive notifications, and analyze baby cries to support day-to-day parenting decisions.

This repository is **not** a Next.js-only app. MamtaAI is built as a **multi-service system**:

| Service | Stack | Role |
|---------|--------|------|
| **Web application** | Next.js 15, React 19, TypeScript | UI, dashboard, marketing pages, and product **API routes** (`/api/*`) — auth gates, Stripe, subscriptions, community, recordings metadata |
| **Data & auth platform** | Supabase (Postgres, Auth, Storage, RLS) | Persistent data, JWT sessions, file storage (recordings, avatars), row-level security |
| **Audio / ML backend** | **Python 3 + FastAPI** (separate service) | Live audio streaming, noise reduction, feature extraction, cry classification — consumed via `NEXT_PUBLIC_BACKEND_URL` |

The browser talks to **Next.js** first. Next.js enforces auth and plan limits, reads/writes **Supabase**, and coordinates with the **FastAPI** service when a recording needs AI processing. Cry analysis will not work without the Python backend running.

The FastAPI project is maintained as a **sibling codebase** (often cloned as `mamtaai_python_backend` next to this repo; see `.gitignore`). It is not bundled inside this Next.js tree.

## Architecture at a glance

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ─────────────► │  Next.js (app)   │
└─────────────┘                │  UI + /api/*     │
                               └────────┬─────────┘
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐
            │   Supabase   │   │    Stripe    │   │  Python / FastAPI   │
            │ Postgres+Auth│   │   Checkout   │   │  Audio ML pipeline  │
            │   Storage    │   │   Webhooks   │   │  (port 8000 default)│
            └──────────────┘   └──────────────┘   └─────────────────────┘
```

**Typical cry-analysis flow**

1. User records audio in the dashboard (`ProcessingProgress` streams to FastAPI).
2. The **FastAPI** service processes audio and returns cleaned audio / features.
3. The client posts to Next.js `POST /api/audio/process`, which uploads to **Supabase Storage** and creates a `recordings` row.
4. Predictions are saved via `POST /api/recordings/[id]/prediction`; insights APIs read from Supabase.

## Highlights

- Baby profiles with age, growth, and relation management.
- Family invites and role-based access (primary parent vs invited caregivers).
- Recording and activity timeline (feeding, sleep, cry-related flows).
- **Cry analysis** via the **Python (FastAPI)** ML backend, with results stored in Supabase.
- Insights dashboard and health suggestion popovers.
- Community (blog, forum, resources, favorites).
- In-app notifications with sound/highlight preferences.
- **Subscription plans (Free, Plus, Pro)** with server-side usage limits.
- **Stripe Checkout & Customer Portal** for upgrades and billing management.
- Secure auth and profile management using Supabase.

## Tech stack

| Area | Technologies |
|------|----------------|
| Frontend & app API | Next.js 15 (App Router), React 19, TypeScript |
| Data & auth | Supabase (Postgres, Auth, Storage, RLS) |
| **Audio / ML backend** | **Python 3, FastAPI, Uvicorn** (external service; streaming + inference) |
| Payments | Stripe (Checkout, Customer Portal, webhooks) |
| UI | Tailwind CSS, Framer Motion |
| Tooling | Jest, ESLint, Prettier, Husky, Commitlint |

## Quick start

### 1. Clone and install (Next.js app)

```bash
git clone <your-repo-url>
cd mamtaAi
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_URL` | App base URL |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (OAuth redirects, Stripe return URLs) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin operations |
| `NEXT_PUBLIC_BACKEND_URL` | **FastAPI base URL** (default `http://localhost:8000`) |
| `SMTP_*` | Transactional email (host, port, user, pass, from) |
| `STRIPE_SECRET_KEY` | Stripe secret (`sk_test_…` in development) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_PRICE_PLUS_MONTHLY` / `STRIPE_PRICE_PRO_MONTHLY` | Test Price IDs |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional publishable key |
| `MODEL_CONFIDENCE_THRESHOLD` | Optional ML threshold override |

### 3. Supabase setup

Run in the Supabase SQL Editor (first-time):

- `supabase/subscription_setup.sql` — Free / Plus / Pro plans and RLS
- `supabase/stripe_link_prices.sql` — link Stripe test Price IDs to Plus and Pro

Add your local and production URLs to **Authentication → Redirect URLs**.

### 4. Start the Python / FastAPI backend

In your **Python backend project** (e.g. `mamtaai_python_backend`):

```bash
# Example — use your repo's actual command (often uvicorn)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The dashboard expects endpoints such as:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service health |
| `GET /api/streaming/health` | Streaming router health |
| `POST /api/streaming/process-audio` | Live cry processing |

Set `NEXT_PUBLIC_BACKEND_URL` if the service runs on a host or port other than `http://localhost:8000`.

### 5. Start the Next.js app

```bash
npm run dev
```

Open:

- Web app: `http://localhost:3000`
- Pricing: `http://localhost:3000/pricing`
- FastAPI health (verify ML backend): `http://localhost:8000/health`

### 6. Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the signing secret from the CLI as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Subscription plans

Three tiers. Limits live in `src/lib/subscription/plans.ts`, are stored in `subscription_plans.limitations`, and are **enforced in Next.js API routes** (babies, recordings, invites, activities, community, insights export, and more).

| Plan | Price (USD) | Summary |
|------|-------------|---------|
| **Free** | $0 | 1 baby, 7 cry analyses/month, 30s recordings, 7-day insights |
| **Plus** | $9.99/mo | Up to 3 babies, 60 analyses/month, 2-min recordings, caregivers, 90-day insights |
| **Pro** | $19.99/mo | Unlimited babies/caregivers (fair use), unlimited analyses (fair use), 5-min recordings, all-time insights |

New users get **Free** on signup. Upgrades use **Stripe Checkout**; plan changes and billing use the **Stripe Customer Portal**.

### User-facing surfaces

- `/pricing` — plan comparison, FAQ, upgrade CTAs
- `/dashboard/settings?tab=billing` — current plan, usage, billing history, manage billing
- `/billing/success` — post-checkout confirmation

### Billing API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscription` | GET | Current plan, usage, meters, billing metadata |
| `/api/billing/checkout` | POST | Stripe Checkout or in-place plan change |
| `/api/billing/portal` | POST | Stripe Customer Portal session |
| `/api/billing/confirm` | POST | Confirm Checkout after redirect |
| `/api/billing/history` | GET | Payment transaction history |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

Plan limit errors return HTTP **403** with `error: "PLAN_LIMIT_REACHED"`.

### Key code locations

```text
src/lib/subscription/          # plans, limits, usage
src/lib/stripe/                # Checkout, portal, webhook sync
src/components/pricing/        # Pricing page
src/hooks/useSubscription.tsx  # Client subscription context
src/hooks/useBilling.ts        # Checkout / portal helpers
src/components/Dashboard/ProcessingProgress.tsx  # FastAPI streaming client
src/app/api/audio/process/     # Recording upload + FastAPI coordination
```

### Documentation

- [Subscription plans (product spec)](docs/SUBSCRIPTION_PLANS_FREE_PLUS_PRO.md)
- [Database setup & Stripe operations](docs/SUBSCRIPTION_DATABASE_AND_STRIPE.md)
- [Full architecture & roadmap](docs/PROJECT_PLANNING_DOCUMENT.md)

## Deploying to Vercel

- Deploy **this repo** to Vercel (Next.js only).
- Deploy **FastAPI** separately (e.g. Railway, Render, Fly.io, or a VM) and set `NEXT_PUBLIC_BACKEND_URL` in Vercel to that public URL.
- Copy Supabase and Stripe env vars into Vercel; set `NEXT_PUBLIC_SITE_URL` to your production domain.
- Create a **test or live** Stripe webhook → `https://your-app.vercel.app/api/webhooks/stripe`.
- Add production URLs to Supabase **Redirect URLs**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Jest tests |

## Project structure (this repository)

```text
src/
  app/
    (auth)/                    # Sign in, sign up, password flows
    api/
      audio/process/           # Recording upload; coordinates with FastAPI
      billing/                 # Stripe checkout, portal, history, confirm
      webhooks/stripe/         # Stripe webhooks
      subscription/            # Plan + usage API
      recordings/              # Recording metadata & predictions
    dashboard/                 # Main product UI
    pricing/                   # Public pricing page
  components/
    Dashboard/                 # Dashboard UI (incl. ProcessingProgress → FastAPI)
    pricing/
    subscription/
  lib/
    subscription/              # Plan definitions, limits, usage
    stripe/
    supabase/
  hooks/
    useSubscription.tsx
    useBilling.ts
supabase/
  subscription_setup.sql
  stripe_link_prices.sql
docs/                          # Planning & subscription docs
```

**Outside this repo:** Python/FastAPI service (`mamtaai_python_backend` or equivalent) — ML models, audio streaming routers, and inference logic.

## Core modules (Next.js API)

| Area | Routes / files |
|------|----------------|
| Babies & family | `src/app/api/babies`, invites, members |
| Recordings | `src/app/api/recordings`, `src/app/api/audio/process` |
| Cry ML integration | `ProcessingProgress.tsx` → FastAPI; `audio/process` → Supabase Storage |
| Notifications | `src/app/api/notifications` |
| Subscriptions & billing | `src/app/api/subscription`, `src/app/api/billing`, Stripe webhooks |
| Community | `src/app/dashboard/community`, community API routes |
| Insights | `src/app/api/insights` |

## Notes

- Primary parent permissions are enforced on family-management and invite APIs.
- Keep secrets out of source control (`.env.local` is git-ignored).
- **`NEXT_PUBLIC_BACKEND_URL`** must point at a running **Python (FastAPI)** instance for cry analysis.
- Subscription limits are enforced in **Next.js API routes**; UI mirrors them for messaging only.
- Stripe defaults to **test mode**; switch to live keys and webhooks for production billing.

## Contributing

1. Create a feature branch.
2. Commit using Conventional Commits (e.g. `feat: add caregiver removal action`).
3. Open a pull request with a clear summary and test plan.

## License

Add your preferred license in `LICENSE` (MIT is common for this setup).
