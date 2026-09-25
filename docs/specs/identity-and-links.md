# Spec: Identity & Payment Links

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §7.5. Makes the demo tangible and shareable.

## Objective

Username registration and payment links (pay.useavela.xyz/username). A user picks a username, gets a shareable payment link. Anyone with the link can pay them — the link resolves to the user's account. This makes the OKX Dev Day demo immediately tangible: "here's my payment link, send me money."

## Scope

**In:**
- Username registration (unique, alphanumeric + hyphens, 3-32 chars)
- Username → account resolution
- Payment link generation: `pay.useavela.xyz/<username>`
- Payment link page: shows recipient name, amount input (optional pre-filled), "Pay with Avela" button
- Username display in receipts and payment previews

**Out:**
- ENS integration (Phase 2)
- QR codes (nice-to-have, not MVP)
- Vanity URLs / premium usernames
- Cross-platform identity resolution (WhatsApp number → Avela account)

## Domain Model

```ts
type Identity = {
  id: string
  accountId: string
  username: string          // Unique, lowercase, alphanumeric + hyphens
  displayName: string | null
  createdAt: Date
  updatedAt: Date
}

// Username validation rules
const USERNAME_RULES = {
  minLength: 3,
  maxLength: 32,
  pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,  // Start/end alphanumeric
  reserved: ['admin', 'avela', 'pay', 'api', 'app', 'www', 'help', 'support'],
}
```

## Interfaces

### Core Functions (packages/core)

```ts
registerUsername(accountId: string, username: string): Promise<Identity>
resolveUsername(username: string): Promise<{ accountId: string; walletAddress: string } | null>
isUsernameAvailable(username: string): Promise<boolean>
getIdentity(accountId: string): Promise<Identity | null>
```

### API Endpoints

```
POST /identity/register                — Register username
GET  /identity/available/:username     — Check availability
GET  /identity/resolve/:username       — Resolve to account (public)
```

### Payment Link Page (apps/web)

```
Route: /pay/:username (on app.useavela.xyz)
Short link: pay.useavela.xyz/:username — DNS alias to the same deployment
(avela-web), rewritten to /pay/:username by apps/web/middleware.ts.
Root pay.useavela.xyz/ redirects to https://app.useavela.xyz.
- Resolves username to account
- Shows: recipient display name or username
- Optional: pre-filled amount via query param (?amount=25)
- "Pay with Avela" button → connect wallet → create payment intent
```

## Dependencies

- **core-account** — account existence verification
- **Drizzle ORM** — identities table with unique constraint on username
- **apps/web** — payment link page rendering

## Project Structure

```
packages/core/src/
├── domain/
│   ├── identity.ts            — Username registration, resolution, validation
│   └── types.ts               — (extended with identity types)

apps/web/src/app/
├── pay/
│   └── [username]/
│       └── page.tsx           — Payment link page
```

## Success Criteria

1. Username registration validates rules (length, pattern, reserved words)
2. Duplicate username returns clear error
3. Username resolution returns account wallet address
4. `pay.useavela.xyz/samuel` renders a payment page for that user
5. Payment link with `?amount=25` pre-fills the amount
6. Payment from link creates a payment intent targeting the resolved account
7. Username appears in payment receipts
8. Case-insensitive lookup (stored lowercase)

## Open Questions

- Payment link UX: require payer to connect wallet (Privy), or support "guest pay" with any wallet?
- Should payment links work without an Avela account (direct wallet-to-wallet with Avela as routing)?
