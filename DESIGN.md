# Avela Design System

Single source of truth for visual design. Values here map 1:1 to shadcn CSS variables in `globals.css`. Components use semantic tokens (`bg-primary`, `text-muted-foreground`), never raw hex values.

## Brand palette

| Hex | Name | Role |
|-----|------|------|
| `#151700` | Warm black | Text, dark section background |
| `#2C3500` | Deep olive | Primary (buttons, nav CTA, FAQ bg) |
| `#DDF837` | Chartreuse | Accent (highlights, badges, headings on dark) |
| `#CEE363` | Soft lime | Accent alternative (if chartreuse is too bright) |
| `#566C4A` | Forest | Icon tint, secondary interactive |
| `#6B7350` | Dark sage | Muted foreground (secondary text — WCAG AA) |
| `#ABB189` | Sage | Muted foreground on dark sections |
| `#CEECEF` | Ice blue | Feature card surface |
| `#DEE4FD` | Lavender | Feature card surface |
| `#F2C078` | Peach | Warm accent, article cards, badges |

## Color mapping

### Light (`:root`)

| Token | Role | Hex | Tailwind class |
|-------|------|-----|----------------|
| `--background` | Page background | `#F8F8F3` (warm off-white) | `bg-background` |
| `--foreground` | Primary text | `#151700` (warm black) | `text-foreground` |
| `--primary` | Buttons, links, CTAs | `#2C3500` (deep olive) | `bg-primary` / `text-primary` |
| `--primary-foreground` | Text on primary | `#F8F8F3` (warm off-white) | `text-primary-foreground` |
| `--secondary` | Secondary surfaces | `#F0F0E8` (warm gray) | `bg-secondary` |
| `--muted` | Muted backgrounds | `#F0F0E8` (warm gray) | `bg-muted` |
| `--muted-foreground` | Secondary text | `#6B7350` (dark sage) | `text-muted-foreground` |
| `--accent` | Highlight surfaces, badges | `#DDF837` (chartreuse) | `bg-accent` |
| `--accent-foreground` | Text on accent | `#151700` (warm black) | `text-accent-foreground` |
| `--card` | Card background | `#FFFFFF` (white) | `bg-card` |
| `--border` | Borders | `#E5E5DC` (warm border) | `border-border` |
| `--input` | Input borders | `#E5E5DC` | `border-input` |
| `--ring` | Focus rings | `#566C4A` (forest) | `ring-ring` |
| `--destructive` | Error, danger | `#D32F2F` (red) | `bg-destructive` |

### Dark (`.dark`) — section-level only

Used on FAQ, CTA, footer — not a global theme toggle.

| Token | Role | Hex |
|-------|------|-----|
| `--background` | Dark surface | `#2C3500` (deep olive) |
| `--foreground` | Light text | `#F8F8F3` (warm off-white) |
| `--primary` | Buttons on dark | `#DDF837` (chartreuse) |
| `--primary-foreground` | Text on buttons | `#151700` (warm black) |
| `--card` | Elevated dark surface | `#3A4510` (lighter olive) |
| `--muted` | Muted dark surface | `#3A4510` |
| `--muted-foreground` | Secondary text on dark | `#ABB189` (sage) |
| `--accent` | Accent on dark | `#DDF837` (chartreuse) |
| `--accent-foreground` | Text on accent | `#151700` |
| `--border` | Borders on dark | `#F8F8F3` with 10% opacity |

### Feature card accent colors

These are used as direct utility classes on specific bento cards, not as global tokens:

| Color | Hex | Use | Tailwind |
|-------|-----|-----|----------|
| Ice blue | `#CEECEF` | Card bg for "Cross-border" or similar | `bg-[#CEECEF]` |
| Lavender | `#DEE4FD` | Card bg for "AI operator" or similar | `bg-[#DEE4FD]` |
| Peach | `#F2C078` | Card bg for highlights, warm emphasis | `bg-[#F2C078]` |
| Chartreuse | `#DDF837` | Card bg for primary feature | `bg-[#DDF837]` |

### Chart colors

Derived from brand palette for data visualization:

| Token | Hex | Role |
|-------|-----|------|
| `--chart-1` | `#2C3500` | Deep olive |
| `--chart-2` | `#566C4A` | Forest |
| `--chart-3` | `#DDF837` | Chartreuse |
| `--chart-4` | `#F2C078` | Peach |
| `--chart-5` | `#CEECEF` | Ice blue |

## Typography

### Fonts

| Role | Font | CSS variable | Tailwind class |
|------|------|-------------|----------------|
| Body / UI | Geist Sans | `--font-geist-sans` | `font-sans` |
| Code / data | Geist Mono | `--font-geist-mono` | `font-mono` |

### Scale

Tailwind default type scale. No custom sizes.

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

### Weights

| Weight | Class | Use |
|--------|-------|-----|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Nav links, labels, FAQ questions |
| 600 | `font-semibold` | Section headings, card titles, buttons |
| 700 | `font-bold` | Hero heading, stat numbers only |

### Rules

- `tracking-tight` on all headings (h1, h2)
- `tracking-wider` on uppercase labels
- `text-wrap-balance` on headings
- `text-wrap-pretty` on multi-line body
- `tabular-nums` on financial figures

## Spacing

Tailwind default scale. No custom values.

- Section vertical padding: `py-24` (96px)
- Container max width: `max-w-6xl` (1152px)
- Hero heading max width: `max-w-[680px]`
- Card padding: `p-6` (24px)
- Grid gap: `gap-4` (16px) for cards, `gap-6` (24px) for sections

## Radius

Base: `--radius: 0.625rem` (10px). Derived via shadcn scale.

## Motion

Easing: `cubic-bezier(0.32, 0.72, 0, 1)`

| Pattern | Duration |
|---------|----------|
| Hover/active | 700ms |
| Scroll reveal | 800ms |
| Staggered entry | 600ms + 100ms/item |
| FAQ accordion | 500ms |
| Nav entrance | 800ms |

Active feedback: `active:scale-[0.98]` on buttons.

## Icons

Phosphor Icons (`@phosphor-icons/react`), `weight="duotone"`, `size={32}` for feature icons, `size={16}` for inline.

## Section surfaces

- **Light** (default): warm off-white `bg-background` with warm black text
- **Dark sections** (FAQ, CTA, footer): wrap in `class="dark"` + `bg-background` — deep olive surface, chartreuse accents
- **Tinted cards**: use accent card colors directly (`bg-[#CEECEF]`, etc.) with `text-foreground` for text

## How to update

1. Change hex values in this doc
2. Convert to oklch
3. Update `globals.css` `:root` and `.dark` blocks
4. Components auto-inherit via semantic tokens
