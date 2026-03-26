# Build State

> Last updated: 2026-03-26T14:30:00Z
> Auto-saved after: my.sync — Social Media Factory feature (5th generation type)

## Current Session
- **Feature**: Social Media Factory — 5th generation type for StudioStack
- **Phase**: completed
- **Status**: Full end-to-end feature deployed (frontend + API + n8n + Supabase)

## Completed This Session
- Added `social` to `GenerationType` union + new types (`SocialPlatform`, `SocialPost`, `SocialOutput`)
- Added `social: 10` to `FIXED_CREDITS` and `calculateCredits()` switch
- Created `src/app/api/generate/social/route.ts` (auth, rate limit, Zod validation, credit deduction, n8n trigger, auto-refund)
- Created `src/components/create/forms/social-form.tsx` (URL/text toggle, platform selector, cost preview)
- Created `src/app/app/create/social/page.tsx` (page route)
- Created `src/components/library/social-posts-display.tsx` (per-post copy, hashtag badges, copy-all)
- Updated type-selector (5-column grid, Share2 icon)
- Updated asset-card, download-button, job-card, library detail page for social type
- Updated n8n trigger payload with social-specific fields
- Updated n8n webhook callback schema for social posts metadata
- Created Social Handler n8n code node (URL extraction, Gemini 2.5 Flash, JSON response)
- Added Social route to n8n Switch node + wired connections to Error Handler
- Pushed all 7 n8n nodes (was 6, now 7) — all verification checks passed
- Restored Supabase project, applied schema + migration (`social` in type CHECK constraint)
- Updated CLAUDE.md with architecture improvements
- Build verified: 0 TypeScript errors

## Previous Sessions (carried forward)
- Google API key rotation to StudioStack-dedicated key
- n8n video pipeline optimization: clip count fix, hybrid filler, compression, stale jobs
- Live progress tracking + full tier support for images, motion, descriptions
- Renamed StudioStack across 27+ files
- All n8n workflow nodes patched and active

## Pending
- Deploy to Vercel (push to trigger)
- Top up Kie.ai credits and test hybrid video generation end-to-end
- Upgrade Supabase to Pro for 5GB file limit (needed for 30-min videos)

## Files Modified This Session
- `src/lib/types.ts` — Added social types
- `src/lib/credits.ts` — Added social credits
- `src/lib/n8n/trigger.ts` — Added social payload fields
- `src/app/api/generate/social/route.ts` — NEW: API route
- `src/app/api/webhooks/n8n/route.ts` — Extended callback schema
- `src/app/app/create/social/page.tsx` — NEW: page route
- `src/app/app/create/_client.tsx` — Added SocialForm
- `src/components/create/type-selector.tsx` — Added social option
- `src/components/create/forms/social-form.tsx` — NEW: form component
- `src/components/library/social-posts-display.tsx` — NEW: display component
- `src/components/library/asset-card.tsx` — Added social type config
- `src/components/library/download-button.tsx` — Added social label
- `src/components/jobs/job-card.tsx` — Added social type + metadata link fix
- `src/app/app/library/[id]/page.tsx` — Added social display
- `scripts/fix-n8n-curl.mjs` — Added Social Handler + switch route + connections
- `supabase/migrations/001_initial_schema.sql` — Added social + progress column
- `supabase/migrations/003_add_social_generation_type.sql` — NEW: migration
- `CLAUDE.md` — Architecture improvements

## Key Decisions
- Social posts = 10 credits (fixed, ~50x margin on Claude API cost)
- Posts stored in `output_metadata` JSONB (no file upload needed)
- Gemini 2.5 Flash for generation (fast, cheap, JSON response mode)
- URL input: HTML fetch + strip tags + og:title extraction
- n8n Social Handler follows same callback pattern as Description Handler

## Last Action
Applied Supabase migration — `social` added to generations type CHECK constraint. All systems live.

## Resume Instructions
Feature is complete. Push to master to deploy to Vercel. Consider testing with a real URL and text input to verify n8n Social Handler end-to-end.
