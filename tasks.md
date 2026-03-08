# StudioStack — Phase 1 Tasks (Foundation)

> Phase: 1 of 7
> Status: Not started

---

## 1. Project Scaffolding

- [ ] Create Next.js 14 project with App Router and TypeScript strict mode
- [ ] Configure TailwindCSS v4 with CSS-based config in `src/app/globals.css`
- [ ] Define CSS custom properties for dark theme (background, surface, border, muted, primary, accent)
- [ ] Install core deps: `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`
- [ ] Install Supabase deps: `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Initialize shadcn/ui and install base components (button, input, label, card, sheet, dropdown-menu, avatar, separator, skeleton, toast)
- [ ] Configure Inter font via `next/font/google` in `src/app/layout.tsx`
- [ ] Set up root layout with font, metadata, and global providers

## 2. Core Library Files

- [ ] Create `src/lib/credits.ts` — credit constants and `calculateCredits()` function
- [ ] Create `src/lib/tones.ts` — CONTENT_TONES object, `ContentTone` type, `getTonePrompt()` helper
- [ ] Create `src/lib/providers.ts` — PROVIDERS mapping per tier
- [ ] Create `src/lib/types.ts` — shared TypeScript types: Profile, CreditTransaction, CreditPack, Generation, AffiliateLink, GenerationConfig, all enums
- [ ] Create `src/lib/constants.ts` — APP_NAME, navigation items, default tier selections
- [ ] Create `src/lib/utils.ts` — `cn()` helper, `formatCredits()`, `formatCurrency()`

## 3. Supabase Client Setup

- [ ] Create `src/lib/supabase/client.ts` — browser Supabase client
- [ ] Create `src/lib/supabase/server.ts` — server Supabase client with cookie handling
- [ ] Create `src/lib/supabase/middleware.ts` — session refresh logic
- [ ] Create `src/middleware.ts` — protect `/(app)` routes, redirect unauthenticated to `/login`
- [ ] Create `src/lib/supabase/types.ts` — placeholder Database type export
- [ ] Create `supabase/migrations/001_initial_schema.sql` with complete schema

## 4. Auth Pages and Components

- [ ] Create `src/app/(auth)/layout.tsx` — centred layout, dark background, app logo
- [ ] Create `src/components/auth/login-form.tsx` — email + password, Zod validation, error/loading states
- [ ] Create `src/components/auth/signup-form.tsx` — email + password + name, Zod validation
- [ ] Create `src/components/auth/oauth-buttons.tsx` — Google and GitHub OAuth buttons
- [ ] Create `src/app/(auth)/login/page.tsx` — renders LoginForm + OAuthButtons
- [ ] Create `src/app/(auth)/signup/page.tsx` — renders SignupForm + OAuthButtons
- [ ] Create `src/app/(auth)/verify/page.tsx` — email verification handler
- [ ] Create `src/app/(auth)/forgot-password/page.tsx` — password reset form
- [ ] Create `src/app/auth/callback/route.ts` — OAuth code exchange

## 5. Dashboard Layout

- [ ] Create `src/components/layout/app-sidebar.tsx` — nav links, credit balance, active states
- [ ] Create `src/components/layout/app-header.tsx` — page title, user avatar dropdown
- [ ] Create `src/components/layout/mobile-nav.tsx` — Sheet-based sidebar for mobile
- [ ] Create `src/components/credits/credit-balance.tsx` — compact credit display
- [ ] Create `src/app/(app)/layout.tsx` — dashboard shell with sidebar + header
- [ ] Create `src/app/(app)/page.tsx` — dashboard home with welcome, credits, quick links
- [ ] Create stub pages:
  - [ ] `src/app/(app)/create/page.tsx`
  - [ ] `src/app/(app)/library/page.tsx`
  - [ ] `src/app/(app)/credits/page.tsx`
  - [ ] `src/app/(app)/settings/page.tsx`
  - [ ] `src/app/(app)/jobs/page.tsx`
- [ ] Create `src/app/(marketing)/layout.tsx` — marketing layout
- [ ] Create `src/app/(marketing)/page.tsx` — stub landing page

## 6. Zustand Stores

- [ ] Create `src/stores/user-store.ts` — user, profile, isLoading, actions
- [ ] Create `src/stores/credit-store.ts` — balance, isLoading, deduct/add/fetch actions
- [ ] Create `src/components/providers/store-provider.tsx` — auth listener, profile sync

## 7. Shared Components

- [ ] Create `src/components/shared/loading.tsx` — skeleton + spinner variants
- [ ] Create `src/components/shared/empty-state.tsx` — icon + title + description + action
- [ ] Create `src/components/shared/error-boundary.tsx` — error boundary with retry

## 8. Environment Template

- [ ] Create `.env.local.example` with all env var keys grouped by service
- [ ] Verify `.env.local` is in `.gitignore`

---

## Completion Criteria

1. `npm run dev` starts without errors
2. Auth flow works: signup, login, logout, email verification
3. Protected routes redirect to login when unauthenticated
4. Dashboard renders with sidebar, header, mobile nav, credit balance (0)
5. All stub pages render within dashboard layout
6. Zustand stores sync with Supabase auth state
7. All lib files export correct types and constants
8. SQL migration file ready for Supabase
