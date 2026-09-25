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
| `#151700` | Warm black — SUPERSEDED by ink `#28211B` | — | Do not use; every former use now maps to ink |
| (derived) | Dark elevated surface | `oklch(0.309 0.015 62.7)` | Dark card/popover/muted/secondary |

Text rule: never pure black text on light, never pure white text on dark — always the ink/cream pair (`#28211B` / `#FEFDF0`).

Dropped from v0: ice blue and lavender feature colors. Do not use them.
TBD: a sixth sage color is reserved but undecided — do not invent one. Leave the slot empty until approved.

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

Geist only. Body/UI: Geist Sans (`--font-sans`, `font-sans`). Headings/code-data: Geist Mono — layouts set `--font-heading` via `Geist_Mono({ variable: "--font-heading" })`, wired in `@theme inline` as `--font-heading: var(--font-heading)` (class `font-heading`).

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

Weights: 400 body, 500 nav/labels/FAQ questions, 600 section headings/card titles/buttons, 700 hero + stat numbers only.

Rules: `tracking-tight` on all headings, `tracking-wider` on uppercase labels, `text-wrap-balance` on headings, `text-wrap-pretty` on multi-line body, `tabular-nums` on financial figures.

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
| Phone spending-power mock | `apps/site/components/phone-moment.tsx` | CSS-built, static demo figures | Live web PWA screenshot | TODO |
| CTA lifestyle photo | `apps/site/components/photo-cta.tsx` | `https://picsum.photos/seed/avela-cta/1920/1080` (1920×1080) | Commissioned lifestyle photography | TODO |
| Social share image | `apps/site/app/` | — | Generated og-image | TODO |
