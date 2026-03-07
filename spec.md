# ContentForge — Phase 1 Specification (Foundation)

> Version: 1.0.0
> Created: 2026-03-07
> Phase: 1 of 7 — Foundation

---

## Project Overview

ContentForge is an AI-powered SaaS content creation platform for podcasters and YouTube storytellers. Creators generate MP3 episodes, videos (static or AI motion), SEO descriptions, and thumbnails. The key differentiator is **creator choice**: users pick quality tiers (Standard/Premium/Ultra) for voice, images, and motion, paying per-credit with no subscription.

**Business model:** Per-credit pricing. Users buy credit packs (50-5000 credits), spend credits on generations. Margins stay above 50% on all tier combinations, with a blended average around 70%.

**Target users:** Podcasters, YouTube creators, storytellers, content agencies.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ | App Router, Server Components, Server Actions |
| Language | TypeScript 5+ | Strict mode, no `any` |
| Styling | TailwindCSS v4 | CSS-based config (NOT tailwind.config.ts) |
| State | Zustand | User, credits, cart stores |
| Forms | React Hook Form + Zod | Validation on all inputs |
| Icons | Lucide React | |
| UI Base | shadcn/ui | Customised dark theme |
| Auth & DB | Supabase | Auth, PostgreSQL, Storage, Edge Functions, Realtime |
| Payments | PayFast (ZAR) + Stripe (USD) | Phase 2 |
| AI Orchestration | n8n | Phase 3 |
| Hosting | Vercel (app), Supabase (DB), VPS (Kokoro TTS, n8n) | |

---

## Database Schema

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
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund', 'bonus')),
  description TEXT,
  reference_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit packs (products)
CREATE TABLE public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_zar INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
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
  input_topic TEXT NOT NULL,
  input_duration INTEGER,
  input_style TEXT,
  tone TEXT CHECK (tone IN ('sleep', 'asmr', 'bedtime_story', 'storytelling', 'documentary', 'educational', 'podcast', 'youtube_hype')),
  voice_tier TEXT CHECK (voice_tier IN ('standard', 'premium', 'ultra')),
  image_tier TEXT CHECK (image_tier IN ('standard', 'premium', 'ultra')),
  motion_tier TEXT CHECK (motion_tier IN ('static', 'ai', 'premium')),
  scene_count INTEGER,
  use_brand_voice BOOLEAN DEFAULT false,
  affiliate_link_ids UUID[],
  output_url TEXT,
  output_metadata JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Affiliate links
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

-- RLS
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

## Route Structure (Phase 1 Scope)

```
src/app/
├── layout.tsx                          # Root layout, global providers, fonts
├── globals.css                         # Tailwind v4 imports, CSS variables, dark theme
├── (auth)/
│   ├── layout.tsx                      # Centred card layout, no sidebar
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify/page.tsx
│   └── forgot-password/page.tsx
├── (app)/
│   ├── layout.tsx                      # Dashboard shell: sidebar + header + mobile nav
│   ├── page.tsx                        # Dashboard home
│   ├── create/page.tsx                 # [stub]
│   ├── library/page.tsx                # [stub]
│   ├── credits/page.tsx                # [stub]
│   ├── settings/page.tsx               # [stub]
│   └── jobs/page.tsx                   # [stub]
└── (marketing)/
    ├── layout.tsx
    └── page.tsx                        # [stub]
```

---

## Component Hierarchy (Phase 1)

```
src/components/
├── ui/                                 # shadcn/ui primitives
├── layout/
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   ├── mobile-nav.tsx
│   ├── marketing-header.tsx            # [stub]
│   └── marketing-footer.tsx            # [stub]
├── auth/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── oauth-buttons.tsx
├── credits/
│   └── credit-balance.tsx
└── shared/
    ├── loading.tsx
    ├── empty-state.tsx
    └── error-boundary.tsx
```

---

## State Management (Zustand)

### User Store — `src/stores/user-store.ts`
- State: `user`, `profile`, `isLoading`
- Actions: `setUser`, `setProfile`, `setLoading`, `clear`

### Credit Store — `src/stores/credit-store.ts`
- State: `balance`, `isLoading`
- Actions: `setBalance`, `deductCredits`, `addCredits`, `fetchBalance`

---

## Auth Flow

1. Sign Up: `supabase.auth.signUp()` → email verification → profile row created
2. Login: `supabase.auth.signInWithPassword()` → redirect to dashboard
3. OAuth: Google/GitHub via `supabase.auth.signInWithOAuth()`
4. Verify: Email link → `/verify` confirms token
5. Forgot Password: `supabase.auth.resetPasswordForEmail()`
6. Session: Middleware checks session on `/(app)` routes, redirects to `/login`
7. Logout: `supabase.auth.signOut()` → redirect to `/`

---

## Credit System Core Types

```typescript
export const VOICE_CREDITS = { standard: 0.5, premium: 1, ultra: 4 } as const;
export const IMAGE_CREDITS = { standard: 0.5, premium: 1.2, ultra: 2 } as const;
export const MOTION_CREDITS = { static: 0, ai: 8, premium: 15 } as const;
export const FIXED_CREDITS = { description: 5, thumbnail: 8 } as const;

export type VoiceTier = 'standard' | 'premium' | 'ultra';
export type ImageTier = 'standard' | 'premium' | 'ultra';
export type MotionTier = 'static' | 'ai' | 'premium';
export type GenerationType = 'mp3' | 'video' | 'description' | 'thumbnail';
export type ContentTone = 'sleep' | 'asmr' | 'bedtime_story' | 'storytelling' | 'documentary' | 'educational' | 'podcast' | 'youtube_hype';
```

---

## Design System Rules

- **Dark mode default.** Background: `#0a0a0a`, Surface: `#111111`, Border: `#1e1e1e`
- **Primary:** Deep blue-violet (`#6366f1` indigo-500)
- **Font:** Inter via `next/font/google`
- **Tables over cards** for data views
- **No rounded-3xl, no gradient cards, no AI glow effects**
- **Linear/Raycast/Notion aesthetic** — professional, compact, keyboard-accessible
- shadcn/ui restyled to match dark theme
