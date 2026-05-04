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
- Secure auth and profile management using Supabase.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Supabase Auth, Database, Storage
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

4. Run the app
   ```bash
   npm run dev
   ```

5. Open
   - App: `http://localhost:3000`
   - Optional audio backend (if used): `http://localhost:8000`

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

- `src/app/api/babies` - baby CRUD, invites, members, membership leave.
- `src/app/api/recordings` - recording storage and metadata APIs.
- `src/app/api/audio/process` - proxy upload/processing endpoint for audio workflow.
- `src/app/api/notifications` - notification fetch/read operations.
- `src/app/dashboard/community` - forum, blog, and resources interfaces.

## Notes

- Primary parent permissions are enforced on family-management and invite APIs.
- Keep secrets out of source control (`.env.local` should be git-ignored).
- Some audio processing paths depend on an external backend configured via `NEXT_PUBLIC_BACKEND_URL`.

## Contributing

1. Create a feature branch.
2. Commit using Conventional Commits (for example: `feat: add caregiver removal action`).
3. Open a pull request with a clear summary and test plan.

## License

Add your preferred license in `LICENSE` (MIT is common for this setup).