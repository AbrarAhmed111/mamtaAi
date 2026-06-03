# MamtaAI

MamtaAI is an AI-powered baby care platform built with Next.js and Supabase.  
It helps families track baby activities, manage caregiver access, receive real-time notifications, and use cry-audio workflows to support day-to-day parenting decisions.

## Highlights

- Baby profiles with age, growth and relation management.
- Family invites and role-based access (primary parent vs invited caregivers).
- Recording and activity timeline features (feeding, sleep, and cry-related flows).
- Insights dashboard and health suggestion popovers.
- Community space (blog, forum, resources, favorites).
- In-app notifications with sound/highlight preferences.
- **Subscription plans (Free, Plus, Pro)** with usage limits enforced in the API and UI.
- **Stripe Checkout & Customer Portal** (test/sandbox mode supported) for upgrades and billing management.
- Secure auth and profile management using Supabase.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Supabase Auth, Database, Storage
- Stripe (Checkout, Customer Portal, webhooks)
- Tailwind CSS
- Jest + Testing Library
- ESLint, Prettier, Husky, Commitlint

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
   - **Stripe (sandbox / test mode):**
     - `STRIPE_SECRET_KEY` — `sk_test_…`
     - `STRIPE_WEBHOOK_SECRET` — from Stripe CLI locally, or Dashboard webhook on Vercel
     - `STRIPE_PRICE_PLUS_MONTHLY` — test Price ID for Plus
     - `STRIPE_PRICE_PRO_MONTHLY` — test Price ID for Pro
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — optional (`pk_test_…`)

4. Seed subscription plans in Supabase (first-time setup)  
   Run in the Supabase SQL Editor:
   - `supabase/subscription_setup.sql` — Free / Plus / Pro plans and RLS
   - `supabase/stripe_link_prices.sql` — link Stripe test Price IDs to Plus and Pro

5. Run the app
   ```bash
   npm run dev
   ```

6. Open
   - App: `http://localhost:3000`
   - Pricing: `http://localhost:3000/pricing`
   - Optional audio backend (if used): `http://localhost:8000`

7. Stripe webhooks (local development)
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
    api/
      billing/                 # Stripe checkout, portal, confirm
      webhooks/stripe/         # Stripe webhook endpoint
      subscription/            # Plan + usage API
    billing/success/           # Post-checkout success UI
    pricing/                   # Public pricing page
    dashboard/                 # Main product UI (settings billing section)
  components/
    Dashboard/                 # Dashboard widgets/layout components
    pricing/                   # Pricing page components
    subscription/              # Plan usage banner
    marketing/                 # Shared landing nav
    auth/                      # Auth UI components
    ui/                        # Shared UI primitives
  lib/
    subscription/              # Plan definitions, limits, usage
    stripe/                    # Stripe client, checkout, sync
    supabase/                  # Supabase clients/context/actions
    notifications/             # Notification logic
    email/                     # Email templates and sending utilities
  hooks/
    useSubscription.tsx        # Subscription context hook
    useBilling.ts              # Checkout / portal hook
  assets/                      # Global CSS + images
supabase/
  subscription_setup.sql       # Seed Free / Plus / Pro
  stripe_link_prices.sql       # Attach Stripe Price IDs to plans
```

## Core Modules

- `src/app/api/babies` - baby CRUD, invites, members, membership leave.
- `src/app/api/recordings` - recording storage and metadata APIs.
- `src/app/api/audio/process` - proxy upload/processing endpoint for audio workflow.
- `src/app/api/notifications` - notification fetch/read operations.
- `src/app/api/subscription` - current plan, usage meters, billing flags.
- `src/app/api/billing` - Stripe Checkout, portal, and session confirm.
- `src/app/api/webhooks/stripe` - subscription and invoice sync from Stripe.
- `src/app/dashboard/community` - forum, blog, and resources interfaces.

## Notes

- Primary parent permissions are enforced on family-management and invite APIs.
- Keep secrets out of source control (`.env.local` should be git-ignored).
- Some audio processing paths depend on an external backend configured via `NEXT_PUBLIC_BACKEND_URL`.
- Subscription limits apply on the API; the UI mirrors them for messaging only.
- Stripe is configured for **test mode** by default; switch to live keys and live webhooks only when you go to production billing.

## Contributing

1. Create a feature branch.
2. Commit using Conventional Commits (for example: `feat: add caregiver removal action`).
3. Open a pull request with a clear summary and test plan.

## License

Add your preferred license in `LICENSE` (MIT is common for this setup).