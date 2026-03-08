# StudioStack - Progress

> Last updated: 2026-03-07

## Completed

### Task 2: Core Library Files
- [x] `src/lib/types.ts` -- all shared TypeScript types and union types
- [x] `src/lib/credits.ts` -- credit constants (VOICE/IMAGE/MOTION/FIXED) and calculateCredits()
- [x] `src/lib/tones.ts` -- CONTENT_TONES config object and getTonePrompt() helper
- [x] `src/lib/providers.ts` -- PROVIDERS mapping per tier (voice/image/motion)
- [x] `src/lib/constants.ts` -- APP_NAME, NAV_ITEMS, DEFAULT_TIERS
- [x] `src/lib/utils.ts` -- added formatCredits() and formatCurrency() to existing cn()

### Task 3: Supabase Client Setup
- [x] `src/lib/supabase/types.ts` -- placeholder Database type export
- [x] `src/lib/supabase/client.ts` -- browser client with Database generic
- [x] `src/lib/supabase/server.ts` -- server client with cookie handling and Database generic
- [x] `src/lib/supabase/middleware.ts` -- session refresh logic
- [x] `src/middleware.ts` -- protects /app/* routes, redirects to /login
- [x] `supabase/migrations/001_initial_schema.sql` -- full schema, indexes, RLS, seed data, trigger

### Task 6: Zustand Stores
- [x] `src/stores/user-store.ts` -- user, profile, isLoading, actions
- [x] `src/stores/credit-store.ts` -- balance, isLoading, deduct/add/fetch actions

### Task 4: Auth Pages and Components
- [x] `src/app/(auth)/layout.tsx` -- centred layout, dark bg, StudioStack branding
- [x] `src/components/auth/login-form.tsx` -- email+password, Zod validation, Supabase signIn, loading/error states
- [x] `src/components/auth/signup-form.tsx` -- full name+email+password+confirm, Zod with password match, success state
- [x] `src/components/auth/oauth-buttons.tsx` -- Google+GitHub OAuth with separator, loading states
- [x] `src/app/(auth)/login/page.tsx` -- renders LoginForm + OAuthButtons
- [x] `src/app/(auth)/signup/page.tsx` -- renders SignupForm + OAuthButtons
- [x] `src/app/(auth)/verify/page.tsx` -- check-your-email page with mail icon
- [x] `src/app/(auth)/forgot-password/page.tsx` -- password reset form with success state
- [x] `src/app/auth/callback/route.ts` -- OAuth code exchange, redirects to /app

## Remaining (Phase 1)

- [ ] Task 1: Project Scaffolding (partial -- Next.js project exists)
- [ ] Task 5: Dashboard Layout
- [ ] Task 7: Shared Components
- [ ] Task 8: Environment Template

---

# Phase 2 Progress (Credits & Payments)

## Completed

### Payment Libraries
- [x] `src/lib/payfast.ts` -- PayFast signature generation (MD5) and checkout URL creation

- [x] `src/lib/credits-service.ts` -- Server-side credit ops: addCredits, deductCredits, getBalance, getTransactions (uses service role key)

### API Routes
- [x] `src/app/api/webhooks/payfast/route.ts` -- PayFast ITN handler: signature verification, payment_status check, credit allocation

- [x] `src/app/api/credits/purchase/route.ts` -- POST endpoint: auth check, pack lookup, PayFast/Stripe URL generation

### Credit Components
- [x] `src/components/credits/credit-pack-card.tsx` -- Pack display card with name, credits, price, discount badge, recommended highlight
- [x] `src/components/credits/pack-grid.tsx` -- Grid of packs with ZAR/USD currency toggle, loading skeletons, responsive layout
- [x] `src/components/credits/purchase-modal.tsx` -- Payment method selector (PayFast/Stripe), confirm + redirect flow
- [x] `src/components/credits/transaction-table.tsx` -- Table with date, type badges (semantic colors), description, amount, balance; pagination

### Credit Pages
- [x] `src/app/app/credits/page.tsx` -- Full credits page with Tabs (Buy Credits / History), success/cancelled toasts from URL params
- [x] `src/app/app/credits/history/page.tsx` -- Dedicated history page with breadcrumb navigation

### Dependencies
- [x] `stripe` npm package installed

---

# Phase 7 Progress (Legal)

## Completed

### Legal Pages
- [x] `src/app/(marketing)/terms/page.tsx` -- Terms of Service (12 sections, SA governing law)
- [x] `src/app/(marketing)/privacy/page.tsx` -- Privacy Policy (15 sections, POPIA compliant, Information Officer)
- [x] `src/app/(marketing)/refund/page.tsx` -- Refund Policy (7 sections, credit-based refund rules)

---

# Phase 6 Progress (Polish)

## Completed

### Landing Page & Marketing
- [x] `src/app/(marketing)/page.tsx` -- Full landing page: hero, features 2x2 grid, how it works, tier showcase, credit packs table, CTA
- [x] `src/app/(marketing)/pricing/page.tsx` -- Pricing page with credit pack table (USD+ZAR), example costs, FAQ accordion
- [x] `src/app/(marketing)/examples/page.tsx` -- Examples showcase with placeholder samples across podcast, video, description types

### Marketing Layout Components
- [x] `src/components/layout/marketing-header.tsx` -- Sticky header with nav, login/signup CTAs, mobile hamburger menu via Sheet
- [x] `src/components/layout/marketing-footer.tsx` -- 3-column footer (Product, Legal, Company) with copyright
- [x] `src/app/(marketing)/layout.tsx` -- Updated to use MarketingHeader + MarketingFooter

### Error & Loading States
- [x] `src/app/not-found.tsx` -- Custom 404 page, centered, dark themed
- [x] `src/app/error.tsx` -- Global error page with retry button
- [x] `src/app/loading.tsx` -- Global loading spinner

### SEO Metadata
- [x] `src/app/(marketing)/page.tsx` -- title "StudioStack — AI Content Creation for Creators"
- [x] `src/app/(marketing)/pricing/page.tsx` -- title "Pricing — StudioStack"
- [x] `src/app/(marketing)/examples/page.tsx` -- title "Examples — StudioStack"
- [x] `src/app/(auth)/login/page.tsx` -- title "Sign In — StudioStack"
- [x] `src/app/(auth)/signup/page.tsx` -- title "Sign Up — StudioStack"
- [x] `src/app/(auth)/verify/page.tsx` -- title "Verify Email — StudioStack"
- [x] `src/app/(auth)/forgot-password/page.tsx` -- title "Reset Password — StudioStack" (refactored to server component + client form)
- [x] `src/components/auth/forgot-password-form.tsx` -- Extracted client component from forgot-password page

---

# Phase 5 Progress (Settings)

## Completed

### Type System Fix
- [x] `src/lib/types.ts` -- Converted interfaces to type aliases (Profile, CreditTransaction, etc.) to fix Supabase typed client compatibility with supabase-js v2.98 (interfaces lack implicit index signatures)
- [x] `src/lib/supabase/types.ts` -- Added Relationships field to all table types, added delete_own_account RPC function type

### Settings Components
- [x] `src/components/settings/profile-form.tsx` -- Profile form: full name edit, read-only email, password change (current/new/confirm with Zod), danger zone with account deletion dialog (requires typing DELETE)
- [x] `src/components/settings/brand-voice-wizard.tsx` -- Multi-step brand voice wizard: step 1 paste sample content (min 50 chars), step 2 tone/audience/personality traits selection, step 3 review JSON preview + save to profiles.brand_voice JSONB
- [x] `src/components/settings/affiliate-link-manager.tsx` -- Affiliate link CRUD: add form with Zod URL validation, table with inline editing, active/inactive toggle, delete with confirmation dialog, max 20 links

### Settings Pages
- [x] `src/app/app/settings/page.tsx` -- Full settings page with Tabs (Profile | Brand Voice | Affiliate Links) replacing stub
- [x] `src/app/app/settings/brand-voice/page.tsx` -- Dedicated brand voice page with back navigation
- [x] `src/app/app/settings/links/page.tsx` -- Dedicated affiliate links page with back navigation
