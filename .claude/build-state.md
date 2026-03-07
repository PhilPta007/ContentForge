# Build State

> Last updated: 2026-03-07
> Auto-saved after: Full environment setup + n8n workflow creation

## Current Session
- **Feature**: ContentForge — Full Application Build
- **Phase**: complete (all 7 phases built + audit fixes + environment setup + n8n workflows)
- **Status**: complete — ready for testing

## Completed
### Phases 1-7 — Full Build
- 110+ source files, 0 TypeScript errors
- See previous build-state for phase-by-phase details

### Audit Fixes Applied
- Atomic credit operations via PostgreSQL RPCs (add_credits, deduct_credits)
- PayFast/Stripe webhook idempotency (transaction_exists)
- Password schema, Supabase client fixes, user_id filters, error toasts
- New migration: 002_atomic_credits.sql

### UI Bug Fixes
- Credit balance not showing (setBalance missing isLoading: false)
- Dropdown font color (explicit bg-neutral-900 text-white)
- Nested button hydration error (removed Button from DropdownMenuTrigger)

### Environment Setup (This Session)
- `.env.local` fully configured with all API keys:
  - Supabase (URL, anon key, service role key)
  - PayFast sandbox (merchant ID, key, passphrase)
  - n8n webhook URL + secret
  - Google Gemini API key
  - ElevenLabs API key
  - Kokoro TTS (URL, API key, voice)
  - Fal AI key
  - OpenRouter key
  - Kie AI key
  - Resend email key
  - Cloudflare account + token
- Supabase Storage buckets verified: audio, images, video, thumbnails
- Profile created for existing user with 500 test credits

### n8n Workflow Setup (This Session)
- **Deleted**: SnoozCast Generate v13 (snoozcast-v13-nanobanana)
- **Created**: ContentForge Generate (JRKIyos4VFfmWw1D) — active
  - Webhook: POST /webhook/contentforge-generate
  - 8 nodes: Webhook → Switch Router → 4 type handlers + Error Handler
  - **MP3**: Gemini script → TTS (Kokoro standard / ElevenLabs premium+ultra) → Supabase upload → callback
  - **Description**: Gemini generation with brand voice + affiliate links → text upload → callback
  - **Thumbnail**: Image gen (Gemini standard / Fal AI premium+ultra) → Supabase upload → callback
  - **Video**: Script → TTS → Image generation → Ken Burns ffmpeg assembly → upload → callback
  - Error handler reports failures back to app for auto-refund

## Known Limitations
- No Stripe keys configured (not in Global_API.md)
- Local dev callback URL (localhost:3000) not reachable from VPS — generations will process but callback won't update status locally. Works when deployed to production URL.
- Kokoro TTS outputs WAV → converted to MP3 via ffmpeg on VPS

## Pending
- Deploy to production (Vercel/Netlify)
- Configure production `NEXT_PUBLIC_APP_URL` for callbacks
- Add Stripe keys when available
- End-to-end testing with production URL

## Resume Instructions
All phases built, audited, and environment configured. Next steps:
1. Deploy to Vercel/Netlify
2. Set production URL in environment
3. Test all 4 generation types end-to-end
4. Configure Stripe if needed
