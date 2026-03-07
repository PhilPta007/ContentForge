# Build State

> Last updated: 2026-03-07
> Auto-saved after: my.sync — n8n workflow fixes + TTS routing

## Current Session
- **Feature**: Production fixes — n8n workflow, TTS routing, callback URLs
- **Phase**: testing
- **Status**: fixes deployed to n8n, local changes pending Vercel redeploy

## Completed
### Phases 1-7 — Full Build
- 110+ source files, 0 TypeScript errors
- Atomic credit operations via PostgreSQL RPCs (add_credits, deduct_credits)

### Payments
- PayPal REST API (USD) + PayFast (ZAR) — both live credentials

### n8n Workflow Fixes (This Session)
- Replaced `curl`/`fetch` with Node.js `require('https')` for binary ops in sandbox
- Fixed Kokoro TTS: port 8765 -> 5099, POST -> GET with query params
- Fixed premium voice tier: routed to Google Cloud TTS WaveNet (was incorrectly using ElevenLabs)
- Fixed Gemini image generation: raw HTTP for large base64 responses (~1MB)
- Added ElevenLabs quota detection with Kokoro fallback
- All 6 Code nodes patched and pushed via REST API

### Callback & Auth Fixes (This Session)
- Added N8N_CALLBACK_URL env var (points to production) in all 4 generate routes
- Fixed webhook secret trailing newline on Vercel
- Enabled Supabase Realtime publication for generations table

### TTS Tier Mapping (Current)
| Tier | Provider | Method |
|------|----------|--------|
| Standard | Kokoro TTS (self-hosted) | GET :5099/tts?text=...&voice=am_michael |
| Premium | Google Cloud TTS WaveNet | POST texttospeech.googleapis.com |
| Ultra | ElevenLabs Multilingual v2 | POST api.elevenlabs.io |

### Production URLs
- **App**: https://contentforge-sigma.vercel.app
- **Supabase**: https://vlznzzwxdappfbvjlimo.supabase.co
- **n8n Webhook**: https://srv1319171.hstgr.cloud/webhook/contentforge-generate

## Pending
- End-to-end test all generation types (MP3/video/thumbnail/description)
- Redeploy to Vercel with callback URL changes
- Connect Vercel to GitHub for auto-deploy (manual dashboard step)

## Files Modified This Session
- `.env.local` — KOKORO_ENDPOINT port fix, N8N_CALLBACK_URL added
- `src/app/api/generate/mp3/route.ts` — N8N_CALLBACK_URL
- `src/app/api/generate/video/route.ts` — N8N_CALLBACK_URL
- `src/app/api/generate/thumbnail/route.ts` — N8N_CALLBACK_URL
- `src/app/api/generate/description/route.ts` — N8N_CALLBACK_URL
- `scripts/fix-n8n-curl.mjs` — n8n workflow patcher (created, iterated 5x)

## Last Action
Fixed premium voice tier to use Google Cloud TTS WaveNet. Pushed n8n workflow update.

## Resume Instructions
Run end-to-end tests for all generation types. Redeploy to Vercel after confirming locally.
