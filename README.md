# MamtaAI

MamtaAI is an AI-powered baby care platform that combines a **Next.js** (TypeScript) web app, a **Supabase** backend (auth, database, storage), and a separate **Python / FastAPI** service for cry-audio ML processing.  
It helps families track baby activities, manage caregiver access, receive real-time notifications, and analyze baby cries to support day-to-day parenting decisions.

### Architecture at a glance

| Layer | Role |
|-------|------|
| **Next.js 15** | UI, dashboard, marketing pages, and **Route Handlers** (`/api/*`) for product logic, Stripe, subscriptions, and community |
| **Supabase** | Postgres data, Row Level Security, Auth (JWT), file storage (e.g. recordings, avatars) |
| **Python + FastAPI** (separate service) | Audio streaming / ML pipeline — noise reduction, feature extraction, cry classification (via `NEXT_PUBLIC_BACKEND_URL`) |

The browser talks to Next.js first. Next.js enforces auth and plan limits, reads/writes Supabase, and calls the **Python** API when a recording needs AI processing. That service is **not** in this repo (see `.gitignore` for `mamtaai_python_backend`); run it alongside the Next app in development.

## Highlights

- Baby profiles with age, growth and relation management.
- Family invites and role-based access (primary parent vs invited caregivers).
- Recording and activity timeline features (feeding, sleep, and cry-related flows).
- Cry analysis powered by a **Python (FastAPI)** ML backend (streaming audio processing), with results stored in Supabase.
- Insights dashboard and health suggestion popovers.
- Community space (blog, forum, resources, favorites).
- In-app notifications with sound/highlight preferences.
- Secure auth and profile management using Supabase.

## Tech Stack

<<<<<<< Updated upstream
- Next.js 15 (App Router), React 19, TypeScript
- Supabase Auth, Database, Storage
- Tailwind CSS
- Jest + Testing Library
- ESLint, Prettier, Husky, Commitlint
=======
| Area | Technologies |
|------|----------------|
| Frontend & app API | Next.js 15 (App Router), React 19, TypeScript |
| Data & auth | Supabase (Postgres, Auth, Storage, RLS) |
| Audio / ML | **Python**, **FastAPI** (external service; ML inference & audio streaming) |
| Payments | Stripe (Checkout, Customer Portal, webhooks) |
| UI | Tailwind CSS, Framer Motion |
| Tooling | Jest, ESLint, Prettier, Husky, Commitlint |
>>>>>>> Stashed changes

## Quick Start

1. Clone the repo
   ```bash
   git clone <your-repo-url>
   cd mamtaAi
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables  
   Create `.env.local` in the project root and add:
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_FROM_EMAIL`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MODEL_CONFIDENCE_THRESHOLD` (optional)

<<<<<<< Updated upstream
4. Run the app
=======
4. Seed subscription plans in Supabase (first-time setup)  
   Run in the Supabase SQL Editor:
   - `supabase/subscription_setup.sql` — Free / Plus / Pro plans and RLS
   - `supabase/stripe_link_prices.sql` — link Stripe test Price IDs to Plus and Pro

5. Start the **Python / FastAPI** audio/ML service (separate repo, e.g. `mamtaai_python_backend`)  
   ```bash
   # In your Python backend project (uvicorn or your project's run command)
   # Typical default: http://localhost:8000
   ```
   The dashboard expects endpoints such as `/health`, `/api/streaming/health`, and `/api/streaming/process-audio`. Set `NEXT_PUBLIC_BACKEND_URL` if your Python service runs elsewhere.

6. Run the Next.js app
>>>>>>> Stashed changes
   ```bash
   npm run dev
   ```

<<<<<<< Updated upstream
5. Open
   - App: `http://localhost:3000`
   - Optional audio backend (if used): `http://localhost:8000`

=======
7. Open
   - Web app: `http://localhost:3000`
   - Pricing: `http://localhost:3000/pricing`
   - Python API (health check): `http://localhost:8000/health`

8. Stripe webhooks (local development)
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Use the signing secret printed by the CLI as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Subscription Plans

MamtaAI ships three tiers. Limits are defined in code (`src/lib/subscription/plans.ts`), stored in `subscription_plans.limitations`, and **enforced on the server** for API routes (babies, recordings, invites, activities, community, insights export, and more).

| Plan | Price (USD) | Summary |
|------|-------------|---------|
| **Free** | $0 | 1 baby, 7 cry analyses/month, 30s recordings, 7-day insights, read-only community posting limits |
| **Plus** | $9.99/mo | Up to 3 babies, 60 analyses/month, 2-min recordings, 2 caregivers, 90-day insights, limited community publishing |
| **Pro** | $19.99/mo | Unlimited babies/caregivers (fair use), unlimited analyses (fair use), 5-min recordings, all-time insights, unlimited exports & community |

New users receive a **Free** subscription on signup (email or OAuth). Upgrades use **Stripe Checkout**; existing paid subscribers can change plans in-app or via the **Stripe Customer Portal**.

### User-facing surfaces

- `/pricing` — plan comparison, FAQ, upgrade CTAs
- `/dashboard/settings#billing` — current plan, usage meters, upgrade / manage billing
- `/billing/success` — post-checkout confirmation UI (syncs plan, then redirects to settings)
- Dashboard usage banner when approaching limits

### API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscription` | GET | Current plan, usage, meters, billing metadata |
| `/api/billing/checkout` | POST | Start Stripe Checkout or in-place plan change (`{ "planSlug": "plus" \| "pro" }`) |
| `/api/billing/portal` | POST | Open Stripe Customer Portal |
| `/api/billing/confirm` | POST | Confirm Checkout session after redirect (body: `{ "checkoutSessionId": "cs_…" }`) |
| `/api/webhooks/stripe` | POST | Stripe webhook handler (subscription sync, invoices) |

Plan limit errors return HTTP **403** with `error: "PLAN_LIMIT_REACHED"` and a recommended upgrade plan.

### Key code locations

```text
src/lib/subscription/          # plans, limits, usage, service
src/lib/stripe/                # Checkout, portal, webhook sync
src/components/pricing/        # Pricing page UI
src/hooks/useSubscription.tsx  # Client subscription context
src/hooks/useBilling.ts        # Checkout / portal helpers
```

### Documentation

- [Subscription plans (product spec)](docs/SUBSCRIPTION_PLANS_FREE_PLUS_PRO.md)
- [Database setup & Stripe operations](docs/SUBSCRIPTION_DATABASE_AND_STRIPE.md)

### Deploying to Vercel (Stripe still in test mode)

- Copy the same test keys and Price IDs into Vercel environment variables.
- Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://your-app.vercel.app`).
- Create a **test mode** webhook in the Stripe Dashboard pointing to `https://your-app.vercel.app/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` in Vercel (not the local CLI secret).
- Add your Vercel URL to Supabase **Authentication → Redirect URLs**.

>>>>>>> Stashed changes
## Scripts

- `npm run dev` - Start local development server.
- `npm run build` - Build production bundle.
- `npm run start` - Run production server.
- `npm run lint` - Lint and auto-fix.
- `npm run format` - Format code with Prettier.
- `npm run test` - Run tests.
- `npm run test:watch` - Run tests in watch mode.

## Project Structure

```text
src/
  app/
    (auth)/                    # Sign in, sign up, password flows
    api/                       # Route handlers (babies, invites, recordings, notifications, community)
    dashboard/                 # Main product UI
  components/
    Dashboard/                 # Dashboard widgets/layout components
    auth/                      # Auth UI components
    ui/                        # Shared UI primitives
  lib/
    supabase/                  # Supabase clients/context/actions
    notifications/             # Notification logic
    email/                     # Email templates and sending utilities
  assets/                      # Global CSS + images
```

## Core Modules

### Next.js (`src/app/api/*`)

- `src/app/api/babies` — baby CRUD, invites, members, membership leave.
- `src/app/api/recordings` — recording storage and metadata APIs.
- `src/app/api/audio/process` — saves recordings to Supabase; accepts cleaned audio from the Python service; enforces subscription limits.
- `src/components/Dashboard/ProcessingProgress.tsx` — streams audio to the Python/FastAPI backend for live cry processing.
- `src/app/api/notifications` - notification fetch/read operations.
- `src/app/dashboard/community` - forum, blog, and resources interfaces.

## Cry audio flow (Next.js + Python/FastAPI + Supabase)

1. User records audio in the dashboard (`ProcessingProgress` → Python streaming endpoint).
2. The **FastAPI** service returns processed audio / features; the client posts to `POST /api/audio/process`.
3. Next.js uploads the file to **Supabase Storage** and creates a `recordings` row.
4. Prediction data is saved via `POST /api/recordings/[id]/prediction`; insights APIs read from Supabase.

Without the **Python backend** running, cry analysis and streaming flows will fail or show connection errors in the UI.

## Notes

- Primary parent permissions are enforced on family-management and invite APIs.
- Keep secrets out of source control (`.env.local` should be git-ignored).
<<<<<<< Updated upstream
- Some audio processing paths depend on an external backend configured via `NEXT_PUBLIC_BACKEND_URL`.
=======
- **`NEXT_PUBLIC_BACKEND_URL`** must point at your running **Python (FastAPI)** service (default `http://localhost:8000`).
- Subscription limits are enforced in **Next.js API routes**; the UI mirrors them for messaging only.
- Stripe is configured for **test mode** by default; switch to live keys and live webhooks only when you go to production billing.
- Broader architecture and roadmap: [docs/PROJECT_PLANNING_DOCUMENT.md](docs/PROJECT_PLANNING_DOCUMENT.md).
>>>>>>> Stashed changes

## Contributing

1. Create a feature branch.
2. Commit using Conventional Commits (for example: `feat: add caregiver removal action`).
3. Open a pull request with a clear summary and test plan.

## License

Add your preferred license in `LICENSE` (MIT is common for this setup).