# Avela Design System — v1

Single source of truth for visual design. Values here map 1:1 to shadcn CSS variables in `apps/site/app/globals.css` (site only — `apps/web/app/globals.css` still carries the previous token set, pending decision). Components use semantic tokens (`bg-primary`, `text-muted-foreground`), never raw hex values. See [no-hardcoded-hex](#no-hardcoded-hex).

Reference only: the v0 exploration doc at `avela-v0/DESIGN.md` is non-normative. Where v0 and this doc disagree, this doc wins.

## Brand palette (v1)

| Hex | Name | oklch | Role |
|-----|------|-------|------|
| `#28211B` | Ink | `oklch(0.254 0.015 62.7)` | Dark surfaces, light-mode primary, text on light, text on lime/accent |
| `#FEFDF0` | Cream | `oklch(0.991 0.017 103.1)` | Light surfaces, text on dark, text on ink |
| `#DDF837` | Lime | `oklch(0.928 0.202 117.8)` | Accent, dark-mode primary, focus rings |
| `#F2C078` | Peach | `oklch(0.837 0.107 75.5)` | Warm highlight, feature surfaces |
| (derived) | Olive | `oklch(0.53 0.12 118)` | Spend card surface (`bg-feature-olive`), approved Sep 2026 |
| `#151700` | Warm black — SUPERSEDED by ink `#28211B` | — | Do not use; every former use now maps to ink |
| (derived) | Dark elevated surface | `oklch(0.309 0.015 62.7)` | Dark card/popover/muted/secondary |

Text rule: never pure black text on light, never pure white text on dark — always the ink/cream pair (`#28211B` / `#FEFDF0`).

Dropped from v0: ice blue and lavender feature colors. Do not use them.
TBD: reserved — filled by olive (approved Sep 2026 for the Spend card).

## Color mapping

### Light (`:root`) — site

Only the tokens below differ from shadcn stone stock. Everything else keeps its current stock value.

| Token | Value | Role |
|-------|-------|------|
| `--background` | `oklch(0.991 0.017 103.1)` (cream) | Page surfaces |
| `--foreground` | `oklch(0.254 0.015 62.7)` (ink) | Body text |
| `--primary` | `oklch(0.254 0.015 62.7)` (ink) | Buttons, links, CTAs |
| `--primary-foreground` | `oklch(0.991 0.017 103.1)` (cream) | Text on primary |
| `--accent` | `oklch(0.928 0.202 117.8)` (lime) | Highlight surfaces, badges |
| `--accent-foreground` | `oklch(0.254 0.015 62.7)` (ink) | Text on accent |
| everything else | stock | Unchanged |

### Dark (`.dark`) — site

| Token | Value |
|-------|-------|
| `--background` | `oklch(0.254 0.015 62.7)` (ink) |
| `--foreground` | `oklch(0.991 0.017 103.1)` (cream) |
| `--primary` | `oklch(0.928 0.202 117.8)` (lime) |
| `--primary-foreground` | `oklch(0.254 0.015 62.7)` (ink on lime) |
| `--card` / `--popover` / `--muted` | `oklch(0.309 0.015 62.7)` (dark elevated) |
| `--secondary` | `oklch(0.309 0.015 62.7)` (dark elevated) |
| `--card-foreground` / `--popover-foreground` | `oklch(0.991 0.017 103.1)` (cream) |
| `--muted-foreground` / `--secondary-foreground` | `oklch(0.991 0.017 103.1)` (cream) |
| `--accent` | `oklch(0.928 0.202 117.8)` (lime) |
| `--accent-foreground` | `oklch(0.254 0.015 62.7)` (ink on lime) |
| `--border` / `--input` | stock white 10% / 15% — unchanged |
| `--ring` | `oklch(0.928 0.202 117.8)` (lime) |
| `--destructive` | stock — unchanged |

Dark surfaces are section-level (FAQ, CTA, footer via `class="dark"` + `bg-background`), not a global theme toggle.

### Chart colors (`.dark`) — site

| Token | Value | Source |
|-------|-------|--------|
| `--chart-1` | `oklch(0.254 0.015 62.7)` | Ink |
| `--chart-2` | `oklch(0.837 0.107 75.5)` | Peach |
| `--chart-3` | `oklch(0.928 0.202 117.8)` | Lime |
| `--chart-4` | `oklch(0.254 0.015 62.7)` | Ink |
| `--chart-5` | stock | Unchanged |

### Extension tokens

Declared in `:root`, wired through `@theme inline` as `--color-feature-*` (same pattern v0 used), usable as `bg-feature-peach`, `bg-feature-lime`:

| Token | Value | Theme wiring |
|-------|-------|--------------|
| `--feature-peach` | `oklch(0.837 0.107 75.5)` | `--color-feature-peach: var(--feature-peach)` |
| `--feature-lime` | `oklch(0.928 0.202 117.8)` | `--color-feature-lime: var(--feature-lime)` |

## Typography

Display: Gellix 700 (WhatFont-verified against the reference: 95px/86px hero, 64px/65px sections, tight leading). Body/UI: Saans 400/500/600 (`--font-sans`, `font-sans`). Data/numbers: Geist Mono retained (`--font-mono`, `font-mono`) — layouts keep `Geist_Mono({ variable: "--font-mono" })`, wired in `@theme inline` as `--font-mono: var(--font-mono)`. The old `--font-heading` Geist Mono mapping stays in `@theme inline` for compat but nothing uses it — all headings are Gellix.

| File | Weight | Role |
|------|--------|------|
| `apps/site/public/fonts/Gellix-TRIAL-SemiBold.woff2` | 600 | Display semibold |
| `apps/site/public/fonts/Gellix-TRIAL-Bold.woff2` | 700 | Display bold (headings, hero, balance figures) |
| `apps/site/public/fonts/Saans-TRIAL-Regular.woff2` | 400 | Body |
| `apps/site/public/fonts/Saans-TRIAL-Medium.woff2` | 500 | Nav/labels/FAQ questions |
| `apps/site/public/fonts/Saans-TRIAL-SemiBold.woff2` | 600 | Buttons/card titles |
| `apps/site/public/fonts/Saans-TRIAL-Bold.woff2` | 700 | Emphasis in body |
| `apps/site/public/fonts/SaansMono-TRIAL-Regular.woff2` | 400 | Nav links (mono caps) |
| `apps/site/public/fonts/SaansMono-TRIAL-Medium.woff2` | 500 | Nav links (mono caps) |

Loaded via `next/font/local` in `apps/site/app/layout.tsx`: Gellix as `--font-display` (fallback `'Gellix Fallback'`, system-ui, sans-serif), Saans as `--font-sans` (fallback system-ui, sans-serif), both `display: swap`, preloaded. `@theme inline` maps `--font-display: var(--font-display)` (class `font-display`).

woff2 only — per Vercel `next/font/local` recommendation (self-hosted woff2 is the smallest, fastest format; no .ttf/.otf ship). All files upright, no italics in this design.

> TRIAL-LICENSE WARNING: these are Gellix Trial / Saans Trial files. A commercial license must be purchased before production use.

Tailwind default type scale only. No custom sizes.

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | 12px | Captions, labels |
| `text-sm` | 14px | Body small, nav links |
| `text-base` | 16px | Body, button text |
| `text-lg` | 18px | Feature titles, large body |
| `text-xl` | 20px | Section subtitles |
| `text-2xl` | 24px | Small headings |
| `text-3xl` | 30px | Section headings (mobile) |
| `text-4xl` | 36px | Section headings (desktop) |
| `text-5xl` | 48px | Hero heading (mobile) |
| `text-6xl` | 60px | Hero heading (desktop) |

Weights: Saans 400 body, 500 nav/labels/FAQ questions, 600 buttons/card titles; Gellix 700 all headings (h1/h2/h3) + hero + phone balance figures.

Section headings: mobile keeps the type-scale step (`text-3xl`/`text-5xl`), desktop is always 60px (`md:text-[60px] md:leading-[0.95]`, Gellix 700, `tracking-tight`, `text-balance`). Hero h1 follows the same desktop size.

Rules: `font-display` on every h1/h2/h3 and display figure; `leading-[0.9]` on hero-scale text (`text-5xl`+), `leading-tight` on smaller display text; `tracking-tight` on all headings, `tracking-wider` on uppercase labels, `text-wrap-balance` on headings, `text-wrap-pretty` on multi-line body, `tabular-nums` on financial figures (kept alongside Gellix on the balance figure).

## Buttons (site)

All CTAs use `CtaButton` (`components/ui/cta-button.tsx`): full-rounded pill, `md` size `px-8 py-4 text-base` (`sm` for nav: `px-5 py-2.5 text-sm`), semibold label plus arrow in a light circle (`bg-black/10` on lime, `bg-white/20` on ink). Variants: `lime` (dark surfaces), `ink` (light surfaces), `cream` (dark-surface secondary). No rectangular buttons, no bare links as primary CTAs.

## Nav (site)

Fixed full-width bar (`fixed top-0 h-16`, always ink/90 + blur + border-b) — follows the page, never transparent, no scroll listener.
Left: LogoMark + Gellix 700 wordmark. Links: Saans Mono 500, uppercase, `text-[13px]` tracking-widest — nothing else uses mono.
PRODUCTS dropdown (Esc closes, click-outside closes, focus-visible rings) anchors to the on-page product blocks: Spend, Pay, Borrow → `#spend` / `#pay` / `#borrow`, Avela Card (coming soon) → `#card`. One-line desc each, lime title on hover.
Right: lime `CtaButton` pill + hamburger. Mobile: overlay with staggered links, inline PRODUCTS group, CTA pinned bottom.

## Spacing

Tailwind default scale. No custom values. Section `py-24`, container `max-w-6xl`, hero heading `max-w-[680px]`, card `p-6`, grid `gap-4` cards / `gap-6` sections.

## Radius

Base `--radius: 0.625rem`, derived via shadcn scale.

## Motion

Easing: `cubic-bezier(0.32, 0.72, 0, 1)` everywhere.

| Pattern | Duration |
|---------|----------|
| Hover/active | 700ms |
| Scroll reveal | 800ms |
| Staggered entry | 600ms + 100ms/item |
| FAQ accordion | 500ms |
| Nav entrance | 800ms |

Active feedback: `active:scale-[0.98]` on buttons.

## Icons

Phosphor Icons (`@phosphor-icons/react`), `weight="duotone"`, `size={32}` feature icons, `size={16}` inline.

## Section surfaces

- **Light** (default): `bg-background` with foreground text.
- **Dark sections** (FAQ, CTA, footer): wrap in `class="dark"` + `bg-background` — ink surface, lime accents.
- **Feature surfaces**: `bg-feature-peach` / `bg-feature-lime` with `text-foreground` — never raw hex.

## No-hardcoded-hex

No hex literals in components or styles. All color goes through semantic tokens (`bg-primary`, `text-muted-foreground`) or the `feature-*` utilities. If a design needs a color that has no token, add the token here first, then use it.

## How to update

1. Change values in this doc (hex + oklch together).
2. Update `:root` and `.dark` blocks in `apps/site/app/globals.css` — site only (`apps/web` keeps the previous token set until decided).
3. Components auto-inherit via semantic tokens.

## Asset swap list (site placeholders)

| Placeholder | Location | Exact source | Swap with | Status |
|-------------|----------|--------------|-----------|--------|
| App mockup (site) | `apps/site/components/app-mockup.tsx` | CSS-built app view (spending power, positions, balances) | Reference for web/ redesign | DONE |
| CTA lifestyle photo | `apps/site/components/photo-cta.tsx` | `https://picsum.photos/seed/avela-cta/1920/1080` (1920×1080) | Commissioned lifestyle photography | TODO |
| Social share image | `apps/site/app/` | — | Generated og-image | TODO |

## Shared CTA + Global (site)

CtaButton (`apps/site/components/ui/cta-button.tsx`): pill (`rounded-full`, `px-7 py-3.5`, `text-base font-semibold`, label + ArrowRight size 18 in contrasting circle). Variants: `lime` (`bg-accent`), `ink` (`bg-primary`, light sections), `cream` (`bg-primary-foreground`, dark sections). `sm` size for nav. All: `active:scale-[0.98]`, focus rings, APPLE_EASE.
Products dropdown: Spend (/payments) · Pay Links (/settings) · Agents (/agents) · Watchers (/watchers) → `app.useavela.xyz`. No borrow, no card.
Global (`components/global.tsx`, `id="global"`, after SupportedAssets): mono "GLOBAL COVERAGE" eyebrow, Gellix "One account, everywhere.", X Layer + USDG/USDC body, bordered mono region chips (Africa / Southeast Asia / Latin America, built-for framing).
