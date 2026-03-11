# StudioStack — Creator Choice Pricing Model

> Deep dive into options-based pricing
> Created: 2026-03-07

## Philosophy

**Power to the creator.** Let them choose quality vs cost.
- Budget creators: Go cheap, make more content
- Premium creators: Pay more, get better quality
- Phil's margins: 60-80% on all combinations

---

## 🎤 VOICE OPTIONS

### Cost Analysis (per minute of audio)

| Provider | Our Cost | Notes |
|----------|----------|-------|
| **Kokoro** (VPS) | ~R0.05 | Self-hosted, minimal cost |
| **Google WaveNet** | ~R0.30 | $0.016/min, reliable |
| **ElevenLabs** | ~R3.00 | $0.15/min, premium quality |

### Credit Pricing (per 10 minutes)

| Voice Tier | Our Cost | Credits | User Pays | Margin |
|------------|----------|---------|-----------|--------|
| **Standard** (Kokoro) | R0.50 | 5 | R7.50 | 93% |
| **Premium** (Google) | R3 | 10 | R15 | 80% |
| **Ultra** (ElevenLabs) | R30 | 40 | R60 | 50% |

**Voices available:**
- Standard: Kokoro voices (am_michael, af_sarah, etc.)
- Premium: Google WaveNet (en-US-Wavenet-J, en-GB-Wavenet-A, etc.)
- Ultra: ElevenLabs (Daniel, Sarah, Adam, George, etc.)

---

## 🖼️ IMAGE OPTIONS

### Cost Analysis (per image)

| Provider | Our Cost | Notes |
|----------|----------|-------|
| **Nano Banana** (Kie.ai) | ~R0.10 | 10 credits × $0.005 |
| **Google Imagen** | ~R0.40 | $0.02/image |
| **Imagen Ultra** | ~R0.80 | $0.04/image, highest quality |

### Credit Pricing (per 10 images)

| Image Tier | Our Cost | Credits | User Pays | Margin |
|------------|----------|---------|-----------|--------|
| **Standard** (Nano Banana) | R1 | 5 | R7.50 | 87% |
| **Premium** (Imagen) | R4 | 12 | R18 | 78% |
| **Ultra** (Imagen Ultra) | R8 | 20 | R30 | 73% |

---

## 🎬 VIDEO MOTION OPTIONS

### Cost Analysis (per clip/scene)

| Provider | Our Cost | Duration | Notes |
|----------|----------|----------|-------|
| **Ken Burns** (FFmpeg) | R0 | N/A | Static zoom/pan, no AI |
| **VEO3 Fast** (Kie.ai) | ~R5.50 | 8 sec | 60 credits × $0.005 |
| **Kling 1.5** (fal.ai) | ~R9.50 | 10 sec | $0.50/clip |

### Credit Pricing (per scene/clip)

| Motion Tier | Our Cost | Credits | User Pays | Margin |
|-------------|----------|---------|-----------|--------|
| **Static** (Ken Burns) | R0 | 0 | R0 | 100% |
| **AI Motion** (VEO3) | R5.50 | 8 | R12 | 54% |
| **Premium Motion** (VEO3) | R5.50 | 8 | R12 | 54% |

---

## 📝 SCRIPT & DESCRIPTION

### Cost Analysis

| Type | Our Cost | Notes |
|------|----------|-------|
| **Script** (Claude) | ~R1.50 | ~1000 tokens in, 3000 out |
| **SEO Description** | ~R0.50 | Shorter output |
| **Thumbnail Concepts** | ~R0.30 | 3 concepts |

### Credit Pricing

| Asset | Our Cost | Credits | User Pays | Margin |
|-------|----------|---------|-----------|--------|
| **Script** (included) | R1.50 | — | (bundled) | — |
| **SEO Description** | R0.50 | 5 | R7.50 | 93% |
| **Thumbnail** (3 options) | R1.50 | 8 | R12 | 87% |

---

## 📦 COMPLETE ASSET PRICING

### MP3 Audio (10 minutes)

| Configuration | Components | Credits | Price (ZAR) |
|---------------|------------|---------|-------------|
| **Budget MP3** | Script + Kokoro | 10 | R15 |
| **Standard MP3** | Script + Google | 15 | R22.50 |
| **Premium MP3** | Script + ElevenLabs | 45 | R67.50 |

### Video (10 minutes, 20 scenes)

**Base:** Script + Voice + Images + Assembly

| Configuration | Voice | Images | Motion | Total Credits | Price (ZAR) |
|---------------|-------|--------|--------|---------------|-------------|
| **Budget Static** | Kokoro | Nano Banana | Ken Burns | 15 | R22.50 |
| **Standard Static** | Google | Imagen | Ken Burns | 30 | R45 |
| **Premium Static** | ElevenLabs | Imagen | Ken Burns | 65 | R97.50 |
| **Budget Motion** | Kokoro | Nano Banana | VEO3 ×10* | 95 | R142.50 |
| **Standard Motion** | Google | Imagen | VEO3 ×10* | 110 | R165 |
| **Premium Motion** | ElevenLabs | Imagen | VEO3 ×20 | 224 | R336 |
| **Ultra Motion** | ElevenLabs | Imagen Ultra | Kling ×20 | 390 | R585 |

*×10 = 1 clip per 2 images, stretched with slowmo

### Thumbnails

| Configuration | Credits | Price (ZAR) |
|---------------|---------|-------------|
| **Standard** (Nano Banana ×3) | 8 | R12 |
| **Premium** (Imagen ×3) | 15 | R22.50 |

---

## 💰 CREDIT PACK PRICING

Based on typical usage patterns:

| Pack | Credits | Price (ZAR) | Price (USD) | Per Credit |
|------|---------|-------------|-------------|------------|
| **Starter** | 50 | R75 | $4.49 | R1.50 |
| **Creator** | 150 | R199 | $11.99 | R1.33 |
| **Pro** | 500 | R599 | $35.99 | R1.20 |
| **Studio** | 1500 | R1,499 | $89.99 | R1.00 |
| **Agency** | 5000 | R3,999 | $239.99 | R0.80 |

**Volume discounts:**
- Starter: Base price
- Creator: 11% off
- Pro: 20% off
- Studio: 33% off
- Agency: 47% off

---

## 🎛️ UI FLOW — BUILD YOUR CONTENT

### Step 1: Choose Output Type
- [ ] MP3 Audio
- [ ] Video
- [ ] SEO Description
- [ ] Thumbnail

### Step 2: Enter Content Details
- Topic/Title
- Duration (5, 10, 15, 20, 30 min)
- Style (calm, energetic, educational, storytelling)

### Step 3: Choose Quality Tiers

**Voice:**
```
○ Standard (Kokoro) — 5 credits/10min
● Premium (Google WaveNet) — 10 credits/10min  [RECOMMENDED]
○ Ultra (ElevenLabs) — 40 credits/10min
```

**Images:** (video only)
```
○ Standard (Nano Banana) — 5 credits/10 images
● Premium (Imagen) — 12 credits/10 images  [RECOMMENDED]
○ Ultra (Imagen Ultra) — 20 credits/10 images
```

**Motion:** (video only)
```
○ Static (Ken Burns) — FREE
● AI Motion (VEO3) — 8 credits/scene  [RECOMMENDED]
○ Premium Motion (VEO3) — 8 credits/scene
```

### Step 4: Review & Generate

```
┌─────────────────────────────────────────┐
│ YOUR VIDEO                              │
├─────────────────────────────────────────┤
│ Duration:     10 minutes                │
│ Scenes:       20                        │
│ Voice:        Premium (Google)          │
│ Images:       Premium (Imagen)          │
│ Motion:       AI Motion (VEO3) ×10      │
├─────────────────────────────────────────┤
│ TOTAL:        110 credits (R165)        │
│ Your balance: 450 credits               │
├─────────────────────────────────────────┤
│         [Generate Video]                │
└─────────────────────────────────────────┘
```

---

## 📊 MARGIN SUMMARY

| Tier | Average Margin |
|------|----------------|
| Voice - Standard | 93% |
| Voice - Premium | 80% |
| Voice - Ultra | 50% |
| Images - Standard | 87% |
| Images - Premium | 78% |
| Images - Ultra | 73% |
| Motion - Static | 100% |
| Motion - AI | 54% |
| Motion - Premium | 54% |
| Descriptions | 93% |
| Thumbnails | 80-87% |

**Blended average margin (typical usage):** ~70%

---

## 🔑 KEY INSIGHTS

1. **Budget tier exists** — creators can go cheap (Kokoro + Nano Banana + Ken Burns)
2. **Premium is default** — nudge users to middle tier (Google + Imagen + VEO3)
3. **Ultra for serious creators** — ElevenLabs + full AI motion
4. **Margins stay healthy** — even worst case (Ultra everything) is 50%+
5. **Credit packs encourage volume** — up to 47% discount at Agency tier
6. **Transparency** — show credit breakdown before generation

---

## 🎯 RECOMMENDED DEFAULTS

When user selects "Quick Generate":
- Voice: **Premium** (Google WaveNet)
- Images: **Premium** (Imagen)
- Motion: **AI Motion** (VEO3, 1 clip per 2 images + slowmo)

This gives good quality at ~R165 for 10-min video (110 credits).

---

## IMPLEMENTATION NOTES

### Credit Calculation Function

```typescript
interface GenerationOptions {
  type: 'mp3' | 'video' | 'description' | 'thumbnail';
  duration: number; // minutes
  voiceTier: 'standard' | 'premium' | 'ultra';
  imageTier?: 'standard' | 'premium' | 'ultra';
  motionTier?: 'static' | 'ai' | 'premium';
  sceneCount?: number;
}

function calculateCredits(options: GenerationOptions): number {
  let credits = 0;
  
  // Script (bundled)
  credits += 0;
  
  // Voice
  const voiceCreditsPerMin = {
    standard: 0.5,  // Kokoro
    premium: 1,     // Google
    ultra: 4,       // ElevenLabs
  };
  credits += options.duration * voiceCreditsPerMin[options.voiceTier];
  
  // Images (video only)
  if (options.type === 'video' && options.imageTier) {
    const scenes = options.sceneCount || Math.ceil(options.duration * 2);
    const imageCreditsPerScene = {
      standard: 0.5,  // Nano Banana
      premium: 1.2,   // Imagen
      ultra: 2,       // Imagen Ultra
    };
    credits += scenes * imageCreditsPerScene[options.imageTier];
  }
  
  // Motion (video only)
  if (options.type === 'video' && options.motionTier && options.motionTier !== 'static') {
    const scenes = options.sceneCount || Math.ceil(options.duration * 2);
    const motionClips = options.motionTier === 'ai' 
      ? Math.ceil(scenes / 2)  // VEO3: 1 clip per 2 images
      : scenes;                 // Kling: 1 clip per image
    const motionCreditsPerClip = {
      ai: 8,        // VEO3
      premium: 15,  // Kling
    };
    credits += motionClips * motionCreditsPerClip[options.motionTier];
  }
  
  return Math.ceil(credits);
}
```

### Provider Mapping

```typescript
const PROVIDERS = {
  voice: {
    standard: { provider: 'kokoro', model: 'kokoro-v1' },
    premium: { provider: 'google', model: 'en-US-Wavenet-J' },
    ultra: { provider: 'elevenlabs', model: 'eleven_multilingual_v2', voice: 'Daniel' },
  },
  images: {
    standard: { provider: 'kie', model: 'nano_banana' },
    premium: { provider: 'google', model: 'imagen-4.0-generate-001' },
    ultra: { provider: 'google', model: 'imagen-4.0-ultra-generate-001' },
  },
  motion: {
    static: { provider: 'ffmpeg', effect: 'zoompan' },
    ai: { provider: 'kie', model: 'veo3_fast' },
    premium: { provider: 'fal', model: 'kling-video/v1.5/pro/image-to-video' },
  },
};
```
