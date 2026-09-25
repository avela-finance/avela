# Spec: Marketing Site (apps/site)

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4. Product story at useavela.xyz — what judges and users see first.

## Objective

The marketing site at useavela.xyz. Tells the product story: what Avela is, how it works, why it matters. Links to the web app. This is the first impression for OKX Dev Day judges, investors, and early users.

## Scope

**In:**
- Hero: one-liner + CTA ("Launch App" → apps/web)
- How it works: 3-step visual (deposit → spending power → pay)
- Features section: spending power, agent spending, WhatsApp access, watchers
- Supported assets: wSPYx, wQQQx, wNVDAx, wGOOGLx, wAAPLx with logos
- "Built on X Layer" branding
- Footer: links, social, legal placeholder
- Mobile-responsive
- Performance: < 2s LCP, < 0.1 CLS

**Out:**
- Blog / content pages
- Pricing page
- Documentation / API docs
- User authentication on the marketing site
- Complex animations (keep it fast)

## Interfaces

### Pages

| Route | Content |
|-------|---------|
| `/` | Landing page (hero, how it works, features, assets, CTA) |

### Sections

```
1. HERO
   "Make your tokenised stocks your everyday spend."
   Subtitle: One programmable account to hold tokenized stocks,
   unlock spending power, and pay across commerce.
   Every payment is a market order on X Layer.
   [Launch App →]

2. HOW IT WORKS
   Step 1: Deposit tokenized stocks (wSPYx, wQQQx, wNVDAx, wGOOGLx, wAAPLx)
   Step 2: See your spending power (haircut applied)
   Step 3: Pay at checkout — stocks stay, merchant gets paid

3. FEATURES
   - Spending power from your portfolio
   - Every payment is a market order — builds real volume on Uniswap V3 xStock pools
   - AI agent spending within permissions
   - Approve payments via WhatsApp
   - Watchers that alert when conditions change
   - Onchain receipts with settlement proof

4. SUPPORTED ASSETS
   Asset cards: wSPYx, wQQQx, wNVDAx, wGOOGLx, wAAPLx with live price (optional)

5. BUILT ON
   X Layer logo, OKX logo, Uniswap logo

6. CTA
   "Start spending from your portfolio."
   [Launch App →]

7. FOOTER
   Links: App, Docs (placeholder), GitHub, Twitter/X
   © 2026 Avela
```

## Dependencies

- **Next.js 15** — Static generation (SSG)
- **Tailwind CSS v4** + Geist font
- **Motion** — subtle hero animation
- Independent of all other features — can be built and deployed first

## Project Structure

```
apps/site/
├── src/
│   ├── app/
│   │   ├── layout.tsx         — Root layout, fonts, metadata
│   │   └── page.tsx           — Landing page
│   ├── components/
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   ├── features.tsx
│   │   ├── supported-assets.tsx
│   │   ├── built-on.tsx
│   │   ├── cta.tsx
│   │   └── footer.tsx
│   └── lib/
│       └── metadata.ts        — SEO metadata
├── public/
│   ├── assets/                — Asset logos, partner logos
│   └── og-image.png           — Open Graph image
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Success Criteria

1. Loads in < 2 seconds (LCP)
2. Hero communicates the value prop in one glance
3. "Launch App" button links to apps/web
4. How-it-works section explains the 3-step flow clearly
5. Features section highlights intelligence layer (agent, WhatsApp, watchers)
6. Responsive: 375px to 1440px
7. SSG — no server-side rendering needed
8. `bun run build` completes without errors
9. Lighthouse performance score > 90
10. OG image and metadata for social sharing

## Open Questions

- Domain: useavela.xyz registered on Vercel (live). `app.useavela.xyz` → avela-web, `api.useavela.xyz` → Render `avela-api` via CNAME.
- Design reference: use avela-v0 site as starting point, or fresh design?
- Asset logos: source from xStocks branding or create custom?
