# Spec: Web Dashboard (apps/web)

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §3.3–3.5. The primary product surface — PWA, mobile-first.

## Objective

The product dashboard where users manage their Avela account: view portfolio, see spending power, make payments, configure policies, manage agent permissions, view receipts, and set up watchers. Mobile-first PWA — this is the "app" users interact with daily.

## Scope

**In:**
- Wallet connection via Privy (embedded wallet or external)
- Account overview: portfolio value, spending power, recent activity
- Portfolio view: positions by asset with values, haircut, spending power contribution
- Spending power display: per-asset breakdown + aggregated total
- Payment history with receipt detail pages
- Spending policy configuration (daily limit, approval threshold, price floors)
- Agent permission dashboard (view agents, their scopes, spending logs)
- Watcher setup (spending power threshold)
- WhatsApp linking flow (enter phone number, verify)
- Username registration
- PWA manifest, service worker, offline shell
- Mobile-first responsive design (375px–1440px)
- Dark mode

**Out:**
- Deposit/withdraw UI for MVP (user deposits via wallet directly, Avela reads onchain state)
- Real-time WebSocket updates (polling for MVP)
- Advanced analytics / charts
- Settings/profile beyond username

## Interfaces

### Pages

| Route | Page | Data Source |
|-------|------|-------------|
| `/` | Dashboard: spending power, recent activity, quick actions | accounts, portfolio, payments |
| `/portfolio` | Position list: assets, values, haircuts, spending power | portfolio, assets |
| `/payments` | Payment history list | payments |
| `/payments/:id` | Payment detail + receipt | payments/:id |
| `/policies` | Spending policy editor | policies |
| `/agents` | Agent list + permission dashboard | agents |
| `/agents/:id` | Agent detail + spending log | agents/:id |
| `/watchers` | Watcher list + create | watchers |
| `/settings` | Username, WhatsApp link | identity |
| `/pay/:username` | Payment link page (public) | identity/resolve |
| `/checkout/*` | Demo merchant (see checkout spec) | — |

### Key Components

```
components/
├── layout/
│   ├── app-shell.tsx          — PWA shell, nav, header
│   ├── mobile-nav.tsx         — Bottom tab navigation
│   └── sidebar.tsx            — Desktop sidebar
├── account/
│   ├── spending-power-card.tsx — Hero metric: total spending power
│   ├── portfolio-summary.tsx   — Asset breakdown
│   └── activity-feed.tsx       — Recent payments/events
├── portfolio/
│   ├── position-card.tsx       — Per-asset card (value, haircut, SP)
│   └── asset-price.tsx         — Live price display
├── payments/
│   ├── payment-list.tsx        — Payment history
│   ├── payment-detail.tsx      — Full receipt with onchain proof
│   └── payment-preview.tsx     — Pre-execution preview
├── policies/
│   ├── policy-editor.tsx       — Form for spending policy rules
│   └── policy-rule.tsx         — Individual rule display
├── agents/
│   ├── agent-card.tsx          — Agent summary with permissions
│   ├── permission-editor.tsx   — Create/edit agent permissions
│   └── spending-log.tsx        — Agent activity log
├── watchers/
│   ├── watcher-card.tsx        — Watcher status and config
│   └── watcher-create.tsx      — Create watcher form
├── connect/
│   ├── wallet-button.tsx       — Privy wallet connect
│   └── whatsapp-link.tsx       — WhatsApp linking flow
└── ui/                         — shadcn/ui primitives
```

### Design Tokens

- **Font:** Geist Sans + Geist Mono
- **Colors:** Dark mode default, Tailwind CSS v4
- **Spacing:** 4px grid
- **Radius:** 8px default, 12px cards
- **Motion:** Framer Motion, subtle transitions

## Dependencies

- **api** — all data via API endpoints
- **core-account** — types shared between API and frontend
- **Privy** — `@privy-io/react-auth` for wallet connection
- **Next.js 15** — App Router, Server Components where possible
- **Tailwind CSS v4** + **shadcn/ui** + **Radix**
- **Motion** (Framer Motion) — page transitions, card animations

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx         — Root layout, providers, fonts
│   │   ├── page.tsx           — Dashboard (/)
│   │   ├── portfolio/
│   │   ├── payments/
│   │   ├── policies/
│   │   ├── agents/
│   │   ├── watchers/
│   │   ├── settings/
│   │   ├── pay/[username]/
│   │   └── checkout/
│   ├── components/            — (structure above)
│   ├── lib/
│   │   ├── api.ts             — API client (fetch wrapper with auth)
│   │   ├── privy.ts           — Privy provider config
│   │   └── format.ts          — Number/currency/address formatting
│   └── hooks/
│       ├── use-account.ts     — Account data hook
│       ├── use-portfolio.ts   — Portfolio data hook
│       └── use-spending-power.ts
├── public/
│   ├── manifest.json          — PWA manifest
│   └── sw.js                  — Service worker
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## Success Criteria

1. Dashboard shows spending power as the hero metric
2. Portfolio page shows all 3 assets with values, haircuts, spending power
3. Spending power updates on page refresh (polling)
4. Payment history shows real payments with onchain receipts
5. Policy editor saves spending rules that the API enforces
6. Agent dashboard shows registered agents with permission scopes
7. Watcher setup: create "alert below $500" watcher
8. WhatsApp linking flow works end-to-end
9. Username registration from settings page
10. PWA installable on mobile (manifest + service worker)
11. Responsive: works on 375px (mobile) through 1440px (desktop)
12. Dark mode as default
13. `bun run typecheck` and `bun run check` pass
14. Lighthouse PWA score > 80

## Open Questions

- State management: TanStack Query alone (noted as future in AGENTS.md) or add Zustand from start?
- Data fetching: Server Components + fetch, or client-side with TanStack Query?
- Deposit UX: show a "Deposit" button that links to wallet, or detect deposits by watching chain events?
