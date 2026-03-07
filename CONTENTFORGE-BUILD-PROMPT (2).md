# ContentForge — Complete Build Prompt

> Copy this entire file into Claude Code to build the project
> Created: 2026-03-07

---

## PERSONA & CONTEXT

You are an expert full-stack engineer building a SaaS application called **ContentForge** — the "Creator's Heaven" for podcasters and YouTube storytellers.

Your responsibilities:
- Build production-ready code with enterprise-grade error handling
- Implement secure authentication and payment processing (PayFast + Stripe)
- Create a credit-based pay-as-you-go system with tiered quality options
- Integrate with AI services (Claude, Google, ElevenLabs, Kie.ai)
- Follow modern design patterns and security best practices
- Create clean, maintainable TypeScript code

---

## PROJECT OVERVIEW

**Project Name:** ContentForge

**Description:** ContentForge is an AI-powered content creation platform that lets creators generate:
- MP3 podcast episodes
- YouTube videos (static Ken Burns or AI motion)
- SEO-optimized descriptions with brand voice
- Thumbnails (3 options per request)

**Key differentiator:** Creator CHOICE. Users select quality tiers for each component:
- Voice: Standard (Kokoro) → Premium (Google) → Ultra (ElevenLabs)
- Images: Standard (Nano Banana) → Premium (Imagen) → Ultra (Imagen Ultra)
- Motion: Static (Ken Burns) → AI (VEO3) → Premium (Kling)

**Business model:** Per-credit pricing. No subscriptions. Users buy credit packs, spend credits on generations.

**Target users:**
- Podcasters (MP3 generation)
- YouTube creators (video + thumbnails + descriptions)
- Storytellers (long-form content)
- Content agencies (volume generation)

**Phase 2 (future):** UGC ad generation for brands

---

## TECHNICAL STACK

### Frontend
| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 14+ | App Router, Server Components, Server Actions |
| TypeScript | 5+ | Strict mode always |
| TailwindCSS | v4 | CSS-based config (NOT tailwind.config.ts) |
| Zustand | Latest | Global state (user, credits, cart) |
| React Hook Form | Latest | Form handling |
| Zod | Latest | Schema validation |
| Lucide React | Latest | Icons |
| shadcn/ui | Latest | Base components |

### Backend
| Technology | Use Case |
|------------|----------|
| Supabase | Auth, PostgreSQL, Storage, Edge Functions, Realtime |
| Row Level Security | Always enabled, always enforced |

### Payments
| Provider | Market | Use Case |
|----------|--------|----------|
| PayFast | South Africa | ZAR, EFT, Local cards |
| Stripe | International | USD, Cards, Apple/Google Pay |

### AI Services (Priority Order)
| Service | Use Case |
|---------|----------|
| Claude (Anthropic) | Scripts, descriptions, brand voice analysis |
| Kokoro (VPS) | Standard TTS (self-hosted, cheapest) |
| Google WaveNet | Premium TTS |
| ElevenLabs | Ultra TTS (highest quality) |
| Kie.ai Nano Banana | Standard images |
| Google Imagen 4.0 | Premium/Ultra images |
| Kie.ai VEO3 Fast | AI video motion |
| fal.ai Kling 1.5 | Premium video motion |

### Workflow
| Tool | Use Case |
|------|----------|
| n8n | Heavy AI processing (scripts → TTS → images → video) |

### Hosting
| Service | Use Case |
|---------|----------|
| Vercel | Web app |
| Supabase | Database, auth, storage |
| Phil's VPS | n8n, Kokoro TTS |

---

## DATABASE SCHEMA

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 0 NOT NULL,
  brand_voice JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = purchase, negative = usage
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund', 'bonus')),
  description TEXT,
  reference_id TEXT, -- payment ID or generation ID
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit packs (products)
CREATE TABLE public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_zar INTEGER NOT NULL, -- in cents
  price_usd INTEGER NOT NULL, -- in cents
  discount_percent INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Generation jobs
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mp3', 'video', 'description', 'thumbnail')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  credits_used INTEGER NOT NULL,
  
  -- Input configuration
  input_topic TEXT NOT NULL,
  input_duration INTEGER, -- minutes (for audio/video)
  input_style TEXT,
  
  -- Content tone
  tone TEXT CHECK (tone IN ('sleep', 'asmr', 'bedtime_story', 'storytelling', 'documentary', 'educational', 'podcast', 'youtube_hype')),
  
  -- Quality tier selections
  voice_tier TEXT CHECK (voice_tier IN ('standard', 'premium', 'ultra')),
  image_tier TEXT CHECK (image_tier IN ('standard', 'premium', 'ultra')),
  motion_tier TEXT CHECK (motion_tier IN ('static', 'ai', 'premium')),
  scene_count INTEGER,
  
  -- Brand voice & affiliate links (for descriptions)
  use_brand_voice BOOLEAN DEFAULT false,
  affiliate_link_ids UUID[],
  
  -- Output
  output_url TEXT,
  output_metadata JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Affiliate links (for SEO descriptions)
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_generations_user_status ON public.generations(user_id, status);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_affiliate_links_user_id ON public.affiliate_links(user_id);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own generations" ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generations" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own affiliate links" ON public.affiliate_links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone view active credit packs" ON public.credit_packs FOR SELECT USING (active = true);

-- Seed credit packs
INSERT INTO public.credit_packs (name, credits, price_zar, price_usd, discount_percent, sort_order) VALUES
('Starter', 50, 7500, 449, 0, 1),
('Creator', 150, 19900, 1199, 11, 2),
('Pro', 500, 59900, 3599, 20, 3),
('Studio', 1500, 149900, 8999, 33, 4),
('Agency', 5000, 399900, 23999, 47, 5);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## CREDIT SYSTEM

### Credit Costs by Tier

```typescript
// lib/credits.ts

export const VOICE_CREDITS = {
  standard: 0.5,   // Kokoro - per minute
  premium: 1,      // Google WaveNet - per minute
  ultra: 4,        // ElevenLabs - per minute
} as const;

export const IMAGE_CREDITS = {
  standard: 0.5,   // Nano Banana - per image
  premium: 1.2,    // Imagen - per image
  ultra: 2,        // Imagen Ultra - per image
} as const;

export const MOTION_CREDITS = {
  static: 0,       // Ken Burns (free)
  ai: 8,           // VEO3 Fast - per clip
  premium: 15,     // Kling - per clip
} as const;

export const FIXED_CREDITS = {
  description: 5,
  thumbnail: 8,
} as const;

export interface GenerationConfig {
  type: 'mp3' | 'video' | 'description' | 'thumbnail';
  duration?: number;
  tone?: 'sleep' | 'asmr' | 'bedtime_story' | 'storytelling' | 'documentary' | 'educational' | 'podcast' | 'youtube_hype';
  voiceTier?: 'standard' | 'premium' | 'ultra';
  imageTier?: 'standard' | 'premium' | 'ultra';
  motionTier?: 'static' | 'ai' | 'premium';
  sceneCount?: number;
}

export function calculateCredits(config: GenerationConfig): number {
  if (config.type === 'description') return FIXED_CREDITS.description;
  if (config.type === 'thumbnail') return FIXED_CREDITS.thumbnail;
  
  let credits = 0;
  const duration = config.duration || 10;
  const scenes = config.sceneCount || Math.ceil(duration * 2);
  
  // Voice
  if (config.voiceTier) {
    credits += duration * VOICE_CREDITS[config.voiceTier];
  }
  
  // Images (video only)
  if (config.type === 'video' && config.imageTier) {
    credits += scenes * IMAGE_CREDITS[config.imageTier];
  }
  
  // Motion (video only)
  if (config.type === 'video' && config.motionTier && config.motionTier !== 'static') {
    // VEO3: 1 clip per 2 scenes (stretched), Kling: 1 per scene
    const clips = config.motionTier === 'ai' ? Math.ceil(scenes / 2) : scenes;
    credits += clips * MOTION_CREDITS[config.motionTier];
  }
  
  return Math.ceil(credits);
}
```

### Content Tones & Styles

```typescript
// lib/tones.ts

export const CONTENT_TONES = {
  // Sleep & Relaxation
  sleep: {
    id: 'sleep',
    name: 'Sleep & Relaxation',
    description: 'Calm, soothing narration for bedtime',
    promptModifiers: {
      pace: 'slow and gentle',
      tone: 'calm, soothing, peaceful',
      pauses: 'include natural pauses between sentences',
      energy: 'low energy, meditative',
    },
    voiceRecommendation: 'premium', // Google WaveNet smooth
    ttsSpeed: 0.85, // Slower
  },
  asmr: {
    id: 'asmr',
    name: 'ASMR / Whisper',
    description: 'Soft, intimate whisper style',
    promptModifiers: {
      pace: 'very slow with long pauses',
      tone: 'soft, intimate, whispered',
      pauses: 'extended pauses for tingles',
      energy: 'minimal, close-mic feel',
    },
    voiceRecommendation: 'ultra', // ElevenLabs for whisper quality
    ttsSpeed: 0.75,
  },
  
  // Storytelling
  storytelling: {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Engaging narrative with dramatic flair',
    promptModifiers: {
      pace: 'varied pacing for drama',
      tone: 'engaging, narrative, expressive',
      pauses: 'dramatic pauses at key moments',
      energy: 'dynamic, rises and falls',
    },
    voiceRecommendation: 'ultra', // ElevenLabs for expression
    ttsSpeed: 1.0,
  },
  bedtime_story: {
    id: 'bedtime_story',
    name: 'Bedtime Story',
    description: 'Gentle storytelling that winds down',
    promptModifiers: {
      pace: 'starts normal, gradually slows',
      tone: 'warm, comforting, gentle',
      pauses: 'natural pauses, longer toward end',
      energy: 'decreasing energy throughout',
    },
    voiceRecommendation: 'premium',
    ttsSpeed: 0.9,
  },
  
  // Educational & Podcast
  educational: {
    id: 'educational',
    name: 'Educational',
    description: 'Clear, informative, easy to follow',
    promptModifiers: {
      pace: 'measured and clear',
      tone: 'informative, friendly, authoritative',
      pauses: 'pauses after key points',
      energy: 'steady, engaging',
    },
    voiceRecommendation: 'premium',
    ttsSpeed: 1.0,
  },
  podcast: {
    id: 'podcast',
    name: 'Podcast / Conversational',
    description: 'Natural, conversational energy',
    promptModifiers: {
      pace: 'natural conversational rhythm',
      tone: 'friendly, casual, authentic',
      pauses: 'natural speech patterns',
      energy: 'medium-high, enthusiastic',
    },
    voiceRecommendation: 'ultra', // ElevenLabs for natural feel
    ttsSpeed: 1.05,
  },
  
  // YouTube
  youtube_hype: {
    id: 'youtube_hype',
    name: 'YouTube Hype',
    description: 'High energy, attention-grabbing',
    promptModifiers: {
      pace: 'fast, punchy',
      tone: 'excited, energetic, bold',
      pauses: 'quick beats, no dead air',
      energy: 'high energy throughout',
    },
    voiceRecommendation: 'ultra',
    ttsSpeed: 1.1,
  },
  documentary: {
    id: 'documentary',
    name: 'Documentary',
    description: 'Authoritative, cinematic narration',
    promptModifiers: {
      pace: 'deliberate, weighty',
      tone: 'serious, cinematic, grand',
      pauses: 'dramatic pauses for impact',
      energy: 'controlled intensity',
    },
    voiceRecommendation: 'ultra', // ElevenLabs George voice
    ttsSpeed: 0.95,
  },
} as const;

export type ContentTone = keyof typeof CONTENT_TONES;

// Get Claude prompt modifier for tone
export function getTonePrompt(tone: ContentTone): string {
  const t = CONTENT_TONES[tone];
  return `
NARRATION STYLE:
- Pace: ${t.promptModifiers.pace}
- Tone: ${t.promptModifiers.tone}
- Pauses: ${t.promptModifiers.pauses}
- Energy: ${t.promptModifiers.energy}
`;
}
```

### Provider Mapping

```typescript
// lib/providers.ts

export const PROVIDERS = {
  voice: {
    standard: {
      provider: 'kokoro',
      endpoint: 'http://31.97.118.216:5099/v1/audio/speech',
      voice: 'am_michael',
    },
    premium: {
      provider: 'google',
      model: 'en-US-Wavenet-J',
    },
    ultra: {
      provider: 'elevenlabs',
      model: 'eleven_multilingual_v2',
      voice: 'Daniel',
    },
  },
  images: {
    standard: {
      provider: 'kie',
      model: 'nano_banana',
      endpoint: 'https://api.kie.ai/api/v1/generate',
    },
    premium: {
      provider: 'google',
      model: 'imagen-4.0-generate-001',
    },
    ultra: {
      provider: 'google',
      model: 'imagen-4.0-ultra-generate-001',
    },
  },
  motion: {
    static: {
      provider: 'ffmpeg',
      effect: 'zoompan',
    },
    ai: {
      provider: 'kie',
      model: 'veo3_fast',
      endpoint: 'https://api.kie.ai/api/v1/veo/generate',
    },
    premium: {
      provider: 'fal',
      model: 'fal-ai/kling-video/v1.5/pro/image-to-video',
    },
  },
} as const;
```

---

## ROUTE STRUCTURE

```
src/app/
├── (marketing)/
│   ├── page.tsx                    # Landing page
│   ├── pricing/page.tsx            # Credit packs
│   ├── examples/page.tsx           # Sample outputs
│   └── layout.tsx
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify/page.tsx
│   ├── forgot-password/page.tsx
│   └── layout.tsx
├── (app)/
│   ├── layout.tsx                  # Dashboard layout (sidebar)
│   ├── page.tsx                    # Dashboard home
│   ├── create/
│   │   ├── page.tsx                # Generation hub (choose type)
│   │   ├── mp3/page.tsx            # MP3 generator
│   │   ├── video/page.tsx          # Video generator
│   │   ├── description/page.tsx    # SEO description
│   │   └── thumbnail/page.tsx      # Thumbnail generator
│   ├── library/
│   │   ├── page.tsx                # All assets
│   │   └── [id]/page.tsx           # Asset detail + download
│   ├── credits/
│   │   ├── page.tsx                # Buy credits
│   │   └── history/page.tsx        # Transaction history
│   ├── settings/
│   │   ├── page.tsx                # Profile
│   │   ├── brand-voice/page.tsx    # Brand voice setup
│   │   └── links/page.tsx          # Affiliate links
│   └── jobs/page.tsx               # Generation queue
├── api/
│   ├── webhooks/
│   │   ├── payfast/route.ts
│   │   ├── stripe/route.ts
│   │   └── n8n/route.ts
│   ├── generate/
│   │   ├── mp3/route.ts
│   │   ├── video/route.ts
│   │   ├── description/route.ts
│   │   └── thumbnail/route.ts
│   └── youtube/
│       └── transcript/route.ts
├── layout.tsx
└── globals.css
```

---

## COMPONENT STRUCTURE

```
src/components/
├── ui/                        # shadcn/ui components
├── layout/
│   ├── marketing-header.tsx
│   ├── marketing-footer.tsx
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   └── mobile-nav.tsx
├── auth/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── oauth-buttons.tsx
├── credits/
│   ├── credit-balance.tsx     # Shows in header
│   ├── credit-pack-card.tsx
│   ├── pack-grid.tsx
│   ├── purchase-modal.tsx
│   └── transaction-table.tsx
├── create/
│   ├── type-selector.tsx      # Choose MP3/Video/etc
│   ├── topic-input.tsx
│   ├── duration-selector.tsx
│   ├── tier-selector.tsx      # Voice/Image/Motion tiers
│   ├── cost-preview.tsx       # Live credit calculation
│   ├── generate-button.tsx
│   └── forms/
│       ├── mp3-form.tsx
│       ├── video-form.tsx
│       ├── description-form.tsx
│       └── thumbnail-form.tsx
├── library/
│   ├── asset-grid.tsx
│   ├── asset-card.tsx
│   ├── asset-player.tsx       # Audio/video player
│   └── download-button.tsx
├── jobs/
│   ├── job-list.tsx
│   ├── job-card.tsx
│   └── job-status.tsx
├── settings/
│   ├── profile-form.tsx
│   ├── brand-voice-wizard.tsx
│   └── affiliate-link-manager.tsx
└── shared/
    ├── loading.tsx
    ├── empty-state.tsx
    └── error-boundary.tsx
```

---

## KEY UI PATTERNS

### Tone Selector Component

```tsx
// components/create/tone-selector.tsx
import { CONTENT_TONES, ContentTone } from '@/lib/tones';

interface ToneSelectorProps {
  value: ContentTone;
  onChange: (tone: ContentTone) => void;
}

const TONE_GROUPS = {
  'Sleep & Relaxation': ['sleep', 'asmr', 'bedtime_story'],
  'Storytelling': ['storytelling', 'documentary'],
  'Educational & Podcast': ['educational', 'podcast'],
  'YouTube': ['youtube_hype'],
};

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Content Tone</label>
      
      {Object.entries(TONE_GROUPS).map(([group, tones]) => (
        <div key={group} className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {group}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tones.map((toneId) => {
              const tone = CONTENT_TONES[toneId as ContentTone];
              return (
                <button
                  key={toneId}
                  onClick={() => onChange(toneId as ContentTone)}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-colors",
                    value === toneId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium text-sm">{tone.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {tone.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Tier Selector Component

```tsx
// components/create/tier-selector.tsx
interface TierOption {
  id: string;
  name: string;
  description: string;
  creditsPerUnit: number;
  recommended?: boolean;
}

interface TierSelectorProps {
  label: string;
  options: TierOption[];
  value: string;
  onChange: (value: string) => void;
  unit: string; // "per minute" or "per image" or "per clip"
}

export function TierSelector({ label, options, value, onChange, unit }: TierSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative p-4 border rounded-lg text-left transition-colors",
              value === option.id 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50",
            )}
          >
            {option.recommended && (
              <span className="absolute -top-2 right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                Recommended
              </span>
            )}
            <div className="font-medium">{option.name}</div>
            <div className="text-sm text-muted-foreground">{option.description}</div>
            <div className="mt-2 text-sm">
              <span className="font-semibold">{option.creditsPerUnit}</span>
              <span className="text-muted-foreground"> credits {unit}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Cost Preview Component

```tsx
// components/create/cost-preview.tsx
interface CostPreviewProps {
  config: GenerationConfig;
  userCredits: number;
}

export function CostPreview({ config, userCredits }: CostPreviewProps) {
  const totalCredits = calculateCredits(config);
  const hasEnough = userCredits >= totalCredits;
  const priceZar = (totalCredits * 1.5).toFixed(2); // R1.50 per credit base
  
  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground">Estimated cost</span>
        <span className="text-2xl font-bold">{totalCredits} credits</span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-3">
        ≈ R{priceZar}
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span>Your balance:</span>
        <span className={hasEnough ? "text-green-500" : "text-red-500"}>
          {userCredits} credits
        </span>
      </div>
      
      {!hasEnough && (
        <Link href="/app/credits" className="mt-3 block">
          <Button variant="outline" className="w-full">
            Buy more credits
          </Button>
        </Link>
      )}
    </div>
  );
}
```

---

## n8n WEBHOOK INTEGRATION

### Trigger Payload (App → n8n)

```typescript
// lib/n8n/trigger.ts
interface GenerationPayload {
  generationId: string;
  userId: string;
  type: 'mp3' | 'video' | 'description' | 'thumbnail';
  
  // Content
  topic: string;
  duration?: number;
  tone?: 'sleep' | 'asmr' | 'bedtime_story' | 'storytelling' | 'documentary' | 'educational' | 'podcast' | 'youtube_hype';
  
  // Provider selections
  voiceTier?: 'standard' | 'premium' | 'ultra';
  imageTier?: 'standard' | 'premium' | 'ultra';
  motionTier?: 'static' | 'ai' | 'premium';
  sceneCount?: number;
  
  // For descriptions
  youtubeUrl?: string;
  brandVoice?: object;
  affiliateLinks?: { label: string; url: string }[];
  
  // Callback
  callbackUrl: string;
}

export async function triggerGeneration(payload: GenerationPayload) {
  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error('Failed to trigger generation');
  }
  
  return response.json();
}
```

### Callback Payload (n8n → App)

```typescript
// app/api/webhooks/n8n/route.ts
interface CallbackPayload {
  generationId: string;
  status: 'complete' | 'failed';
  outputUrl?: string;
  metadata?: {
    duration?: number;
    fileSize?: number;
    format?: string;
  };
  error?: string;
}

export async function POST(request: Request) {
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const payload: CallbackPayload = await request.json();
  const supabase = createClient();
  
  // Update generation status
  const { error } = await supabase
    .from('generations')
    .update({
      status: payload.status,
      output_url: payload.outputUrl,
      output_metadata: payload.metadata,
      error_message: payload.error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', payload.generationId);
  
  if (error) {
    console.error('Failed to update generation:', error);
    return new Response('Database error', { status: 500 });
  }
  
  // If failed, refund credits
  if (payload.status === 'failed') {
    // Implement credit refund logic
  }
  
  return new Response('OK');
}
```

---

## PAYFAST INTEGRATION

```typescript
// lib/payfast.ts
import crypto from 'crypto';

interface PayFastParams {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  custom_str1?: string; // userId
  custom_str2?: string; // packId
}

export function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  const params = Object.keys(data)
    .filter((key) => data[key] !== '')
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  const stringToSign = passphrase
    ? `${params}&passphrase=${encodeURIComponent(passphrase)}`
    : params;

  return crypto.createHash('md5').update(stringToSign).digest('hex');
}

export function createPayFastUrl(
  userId: string,
  packId: string,
  packName: string,
  amountZar: number,
  userEmail: string,
  userName: string
): string {
  const params: PayFastParams = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?cancelled=true`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`,
    name_first: userName.split(' ')[0],
    email_address: userEmail,
    m_payment_id: `${userId}-${packId}-${Date.now()}`,
    amount: amountZar.toFixed(2),
    item_name: `ContentForge ${packName} Credits`,
    custom_str1: userId,
    custom_str2: packId,
  };

  const signature = generatePayFastSignature(
    params as Record<string, string>,
    process.env.PAYFAST_PASSPHRASE
  );

  const searchParams = new URLSearchParams({
    ...params,
    signature,
  } as Record<string, string>);

  const baseUrl = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  return `${baseUrl}?${searchParams.toString()}`;
}
```

---

## ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PayFast (South Africa)
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true

# Stripe (International)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=noreply@contentforge.com

# AI Services
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
KIE_API_KEY=
FAL_KEY=
ELEVENLABS_API_KEY=

# n8n
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://contentforge.com
NEXT_PUBLIC_APP_NAME=ContentForge

# VPS (Kokoro TTS)
KOKORO_ENDPOINT=http://31.97.118.216:5099
```

---

## DESIGN REQUIREMENTS

### Style
- **NO generic AI look** — no cards with gradients, no rounded-3xl
- **Tables > Cards** for data display
- **Professional desktop aesthetic** (Linear, Raycast, Notion style)
- **Dark mode** as default
- **Clean, minimal** — no visual clutter

### Colors
- Primary: Your brand color (suggest deep blue or purple)
- Background: Dark (#0a0a0a)
- Muted: Subtle grays
- Accent: For CTAs and highlights

### Typography
- Font: Inter or system fonts
- Clear hierarchy
- Good contrast

---

## BUILD ORDER (PHASES)

### Phase 1: Foundation (Week 1)
1. Next.js 14 project setup
2. TailwindCSS v4 configuration
3. Supabase project + migrations
4. Authentication (signup, login, verify)
5. Dashboard layout (sidebar, header)
6. Zustand store (user, credits)

### Phase 2: Credits (Week 1-2)
1. Credit balance component
2. /credits page (pack selection)
3. PayFast integration + webhook
4. Stripe integration + webhook
5. Transaction history page
6. Credit deduction logic

### Phase 3: Generation (Week 2-3)
1. Generation form components (tier selectors, cost preview)
2. /create/mp3 page + API route
3. /create/video page + API route
4. /create/description page + API route
5. /create/thumbnail page + API route
6. n8n webhook integration
7. Job queue page

### Phase 4: Library (Week 3)
1. Asset grid/list views
2. Asset detail page
3. Audio/video players
4. Download functionality
5. Filters and search

### Phase 5: Settings (Week 3-4)
1. Profile settings
2. Brand voice wizard
3. Affiliate links manager
4. Account deletion

### Phase 6: Polish (Week 4)
1. Landing page
2. Error handling
3. Loading states
4. Email notifications
5. SEO meta tags

### Phase 7: Legal & Launch
1. Terms of Service
2. Privacy Policy (POPI compliant)
3. Refund Policy
4. Security audit
5. Production deployment

---

## CODING RULES

1. **TypeScript strict mode** — no `any` types
2. **Zod validation** on all inputs
3. **Server Components** where possible
4. **Server Actions** for mutations
5. **Error boundaries** for graceful failures
6. **Loading states** for all async operations
7. **RLS enforcement** — never bypass
8. **Webhook signature verification** always

---

## SUCCESS CRITERIA

- [ ] User can sign up and verify email
- [ ] User can buy credits (PayFast and Stripe)
- [ ] User can generate MP3 with tier selection
- [ ] User can generate video with tier selection
- [ ] User can generate SEO description
- [ ] User can generate thumbnails
- [ ] User can view and download assets
- [ ] User can set up brand voice
- [ ] User can manage affiliate links
- [ ] All margins stay above 50%
- [ ] Mobile responsive
- [ ] Dark mode works

---

Now build this. Start with Phase 1.
