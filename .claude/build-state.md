# Build State

> Last updated: 2026-03-08T19:45:00Z
> Auto-saved after: my.sync — hybrid video gen, Ken Burns fix, stale job detector

## Current Session
- **Feature**: n8n video pipeline optimization — clip count fix, hybrid filler, compression, stale jobs
- **Phase**: testing
- **Status**: all fixes deployed to n8n, awaiting test with Kie.ai credits top-up

## Completed This Session
- Fixed clip count bug: uses `sceneCount` from UI instead of `audioDuration/8` (was 34 clips, now 7)
- Implemented hybrid video generation: VEO3 hero clips + Ken Burns filler clips interleaved
- Fixed Ken Burns shaking: smooth `on/d` ratio interpolation, 12s clips at 25fps, 6 filter variations
- Target bitrate compression: guarantees videos stay under Supabase 50MB limit
- Added stale job detector (`/api/cron/stale-jobs`) — auto-refunds stuck jobs after 30 min
- Fixed hydration mismatch on mobile menu SheetTrigger (explicit id)
- Refunded 65 credits for stuck job `14e374fa` (n8n died at VEO3 clip 25/34)
- Marked stuck job as failed in database
- Investigated Kie.ai API for cheaper video models (Runway gen4_turbo found but no polling endpoint)
- Confirmed Kie.ai credits are depleted — need top-up before next VEO3 test

## Previous Sessions (carried forward)
- Live progress tracking + full tier support for images, motion, descriptions
- Renamed ContentForge → StudioStack across 27+ files
- Fixed n8n Code nodes: catch {} → catch (_e) {} for VM compatibility
- Fixed Kokoro TTS, Google WaveNet, ElevenLabs integration
- All 6 n8n workflow nodes patched and active

## Pending
- Top up Kie.ai credits and test hybrid video generation end-to-end
- Set up Vercel cron for stale job detector (add CRON_SECRET env var + vercel.json cron config)
- Upgrade Supabase to Pro for 5GB file limit (needed for 30-min videos)
- Explore fal.ai Kling 1.5 as cheaper alternative to VEO3 (deferred)
- Clean up tmp-*.json files from repo root

## Files Modified This Session
- `scripts/fix-n8n-curl.mjs` — clip count fix, hybrid filler, smooth Ken Burns, target bitrate compression
- `src/app/api/cron/stale-jobs/route.ts` — NEW: stale job detector with auto-refund
- `src/components/layout/marketing-header.tsx` — hydration fix (explicit id on SheetTrigger)

## Key Decisions
- Hybrid approach: VEO3 for hero clips + Ken Burns filler (cost-effective, reduces repetition)
- Ken Burns 12s clips at 25fps with 6 filter variations (zoom in/out, pan L/R, tilt, diagonal)
- Interleaving: hero-filler-filler-hero pattern for visual variety
- VEO3 cost per 5-min video: ~R52 (7 clips × $0.40)
- Supabase free tier 50MB limit handled via target bitrate encoding

## Last Action
Committed and pushed: hybrid video generation, smooth Ken Burns, stale job detector.

## Resume Instructions
Top up Kie.ai credits, then test a video generation with `motionTier: 'ai'` to verify hybrid filler works. Can also test `motionTier: 'static'` immediately (free) to check smooth Ken Burns quality. Set up Vercel cron for stale jobs.
