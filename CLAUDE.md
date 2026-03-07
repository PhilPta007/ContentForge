# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContentForge is an AI-powered SaaS content creation platform for podcasters and YouTube creators. Users buy credit packs (no subscriptions) and spend credits to generate MP3 podcasts, YouTube videos, SEO descriptions, and thumbnails. The key differentiator is **creator choice** — users select quality tiers (Standard/Premium/Ultra) for each component (voice, images, motion), trading cost vs quality.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router, Server Components, Server Actions), TypeScript (strict), TailwindCSS v4 (CSS-based config, NOT tailwind.config.ts), Zustand, React Hook Form, Zod, shadcn/ui, Lucide React
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime) with RLS always enabled
- **Payments:** PayFast (South Africa/ZAR) + Stripe (International/USD)
- **AI Services:** Claude (scripts/descriptions), Kokoro on VPS (standard TTS), Google WaveNet (premium TTS), ElevenLabs (ultra TTS), Kie.ai Nano Banana (standard images), Google Imagen 4.0 (premium/ultra images), Kie.ai VEO3 (AI motion), fal.ai Kling 1.5 (premium motion)
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

## Architecture

### Route Groups (src/app/)

Three route groups with separate layouts:
- `(marketing)/` — Landing page, pricing, examples (public)
- `(auth)/` — Login, signup, verify, forgot-password (public)
- `(app)/` — Dashboard, create, library, credits, settings, jobs (authenticated)

### API Routes (src/app/api/)

- `webhooks/payfast/` — PayFast ITN payment notifications
- `webhooks/stripe/` — Stripe webhook events
- `webhooks/n8n/` — Generation completion callbacks from n8n
- `generate/{mp3,video,description,thumbnail}/` — Trigger generation jobs
- `youtube/transcript/` — YouTube transcript fetching (for SEO descriptions)

### Core Libraries (src/lib/)

- `credits.ts` — Credit cost constants per tier and `calculateCredits()` function. Voice costs are per-minute, image costs per-image, motion costs per-clip. VEO3 generates 1 clip per 2 scenes (stretched); Kling does 1:1.
- `tones.ts` — Content tone definitions (sleep, asmr, storytelling, documentary, etc.) with prompt modifiers and TTS speed settings
- `providers.ts` — Maps quality tiers to specific AI provider endpoints/models
- `payfast.ts` — PayFast signature generation and checkout URL construction
- `n8n/trigger.ts` — Sends generation payloads to n8n webhook with secret header

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

### State Management (Zustand)

Global stores for: user profile, credit balance, shopping cart. Credit balance must stay in sync with server after purchases and generations.

## Design Rules

- Dark mode default, background #0a0a0a
- Professional desktop aesthetic (Linear/Raycast/Notion style) — NO generic AI card layouts
- Tables over cards for data display
- No rounded-3xl, no gradient cards
- Inter or system fonts

## Webhook Security

Both PayFast and n8n webhooks require signature/secret verification before processing. PayFast uses MD5 signature with passphrase. n8n uses `X-Webhook-Secret` header. Stripe uses `stripe.webhooks.constructEvent()`.

## Build Phases

The project spec defines 7 phases: Foundation → Credits → Generation → Library → Settings → Polish → Legal/Launch. See `CONTENTFORGE-BUILD-PROMPT (2).md` for the complete build spec and `PRICING-MODEL.md` for detailed margin analysis.

## Coding Conventions

- TypeScript strict mode, no `any`
- Zod validation on all inputs
- Server Components by default, Client Components only when needed
- Server Actions for mutations
- RLS policies enforced — never use service role key in client-accessible code
- TailwindCSS v4 uses CSS-based configuration (no JS config file)
