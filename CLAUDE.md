# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StudioStack is an AI-powered SaaS content creation platform for podcasters and YouTube creators. Users buy credit packs (no subscriptions) and spend credits to generate MP3 podcasts, YouTube videos, SEO descriptions, and thumbnails. The key differentiator is **creator choice** — users select quality tiers (Standard/Premium/Ultra) for each component (voice, images, motion), trading cost vs quality.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript (strict), TailwindCSS v4 (CSS-based config, NOT tailwind.config.ts), Zustand 5, React Hook Form 7, Zod 4, shadcn/ui v4, Lucide React
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime) with RLS always enabled
- **Payments:** PayFast (South Africa/ZAR) + PayPal (International/USD)
- **AI Services:** Claude (scripts/descriptions), Kokoro on VPS (standard TTS), Google WaveNet (premium TTS), ElevenLabs (ultra TTS), fal.ai Flux (standard/premium/ultra images), Kie.ai VEO3 Fast (AI + premium motion)
- **Workflow:** n8n handles heavy AI processing pipelines (script → TTS → images → video assembly)
- **Hosting:** Vercel (web app), Supabase (DB/auth/storage), VPS (n8n + Kokoro TTS)

## Build & Dev Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json). Always use `@/` imports.

## Architecture

### Route Groups (src/app/)

Three route groups with separate layouts:
- `(marketing)/` — Landing, pricing, examples, legal pages (public)
- `(auth)/` — Login, signup, verify, forgot-password (public)
- `(app)/` — Dashboard, create, library, credits, jobs, settings (authenticated, behind middleware)

Middleware (`src/middleware.ts`) protects `/app/*` routes — redirects unauthenticated users to `/login`.

### API Routes (src/app/api/)

- `webhooks/payfast/` — PayFast ITN payment notifications
- `webhooks/paypal/capture/` — PayPal payment capture
- `webhooks/n8n/` — Generation completion callbacks from n8n
- `generate/{mp3,video,description,thumbnail}/` — Trigger generation jobs
- `credits/purchase/` — Initiate credit pack purchase
- `cron/stale-jobs/` — Vercel cron to detect and handle stale generation jobs

### Core Libraries (src/lib/)

- `credits.ts` — Credit cost constants per tier and `calculateCredits()` function. Voice costs are per-minute, image costs per-image, motion costs per-clip. VEO3 generates 1 clip per 2 scenes (stretched). Both AI and premium motion use VEO3.
- `credits-service.ts` — Server-side credit operations via Supabase RPCs (`add_credits`, `deduct_credits`, `transaction_exists`). Uses admin client.
- `tones.ts` — Content tone definitions (sleep, asmr, storytelling, documentary, etc.) with prompt modifiers and TTS speed settings
- `providers.ts` — Maps quality tiers to specific AI provider endpoints/models
- `payfast.ts` — PayFast signature generation and checkout URL construction
- `paypal.ts` — PayPal integration
- `rate-limit.ts` — In-memory sliding window rate limiter (per-instance on Vercel serverless)
- `types.ts` — Shared TypeScript types (Profile, Generation, CreditPack, etc.)
- `constants.ts` — App name, nav items, default tier selections
- `n8n/trigger.ts` — Sends generation payloads to n8n webhook with secret header

### Supabase Client Pattern (src/lib/supabase/)

Four client variants — use the right one per context:
- `client.ts` — Browser client (Client Components)
- `server.ts` — Server Components / Server Actions (uses cookies, typed with `Database`)
- `admin.ts` — Service role client (API routes, credit operations — never expose to client)
- `middleware.ts` — Session refresh in Next.js middleware

### Credit System

Credits are the core currency. Key rules:
- Prices stored in `credit_packs` table (cents for both ZAR and USD)
- `credit_transactions` tracks all credit movements (purchase, generation, refund, bonus) with `balance_after`
- Credits deducted atomically before triggering n8n generation
- Failed generations trigger automatic credit refund via n8n callback webhook
- Fixed costs: description = 5 credits, thumbnail = 8 credits (3 options)
- Variable costs: voice/image/motion depend on tier selection and duration/scene count

### Generation Flow

1. User configures generation (type, duration, tone, tier selections)
2. `calculateCredits()` shows live cost preview
3. On submit: API route validates, deducts credits, creates `generations` row (status: pending), triggers n8n webhook
4. n8n processes pipeline (Claude script → TTS → images → video assembly)
5. n8n calls back to `/api/webhooks/n8n` with result URL or error
6. Callback updates generation status; refunds credits on failure

### Database (Supabase PostgreSQL)

5 tables, all with RLS enabled:
- `profiles` — Extends auth.users, holds `credits` balance and `brand_voice` JSONB
- `credit_transactions` — Ledger of all credit changes
- `credit_packs` — Purchasable credit bundles (5 tiers: Starter through Agency)
- `generations` — Job records with tier selections, status tracking, output URLs
- `affiliate_links` — User-managed links injected into SEO descriptions

### Component Organization (src/components/)

- `ui/` — shadcn/ui primitives (button, dialog, table, tabs, etc.)
- `layout/` — App sidebar, header, mobile nav, marketing header/footer
- `create/` — Generation wizard: type/tone/tier selectors, cost preview, per-type forms (mp3, video, description, thumbnail)
- `credits/` — Credit balance display, pack cards, purchase modal, transaction table
- `library/` — Asset grid, asset card, player, download button
- `jobs/` — Job list and job cards for tracking generation progress
- `settings/` — Profile form, brand voice wizard, affiliate link manager
- `auth/` — Login/signup/forgot-password forms, OAuth buttons
- `shared/` — Loading spinner, empty state, error boundary
- `providers/` — Zustand store provider (wraps app)

### State Management (Zustand)

Two stores in `src/stores/`: `user-store.ts` (profile) and `credit-store.ts` (balance). Credit balance must stay in sync with server after purchases and generations.

## Design Rules

- Dark mode default, background #0a0a0a
- Professional desktop aesthetic (Linear/Raycast/Notion style) — NO generic AI card layouts
- Tables over cards for data display
- No rounded-3xl, no gradient cards
- Inter or system fonts

## Webhook Security

Both PayFast and n8n webhooks require signature/secret verification before processing. PayFast uses MD5 signature with passphrase. n8n uses `X-Webhook-Secret` header.

## Build Phases

The project spec defines 7 phases: Foundation → Credits → Generation → Library → Settings → Polish → Legal/Launch. See `STUDIOSTACK-BUILD-PROMPT (2).md` for the complete build spec and `PRICING-MODEL.md` for detailed margin analysis.

## Environment Variables

Copy `.env.local.example` to `.env.local`. Key groups: Supabase (public URL + anon key + service role), PayFast/PayPal (sandbox flags), AI services (Anthropic, Google, ElevenLabs, Kie, fal.ai), n8n (webhook URL + secret + callback URL), and CRON_SECRET for Vercel cron jobs.

## Vercel Configuration

`vercel.json` configures a daily cron job at `/api/cron/stale-jobs` (runs at midnight UTC) for detecting stuck generation jobs. Hosting is on Vercel Hobby plan.

## Coding Conventions

- TypeScript strict mode, no `any`
- Zod validation on all inputs
- Server Components by default, Client Components only when needed
- Server Actions for mutations
- RLS policies enforced — never use service role key in client-accessible code
- TailwindCSS v4 uses CSS-based configuration (no JS config file)
- All types centralized in `src/lib/types.ts` — import from there, don't redeclare
