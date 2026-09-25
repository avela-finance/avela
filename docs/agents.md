# Avela Agents — AI operators with scoped authority

> Agents **operate** the account. They never own it. Every agent action is permission-checked, approval-routed when required, settled through the same vault+reserve path as human payments, and logged with a permission snapshot. This is the programmability that separates Avela from every card product.

MCP tools: [`docs/mcp.md`](mcp.md)

## Mental model

```text
User defines scope ──→ Agent operates inside it ──→ Policy + permission evaluation
        │                        │                              │
  max/tx, max/day,      createPaymentIntent            allowed? requiresApproval?
  assets, recipients,   (API, MCP, or web)             violations? dailyRemaining?
  approval threshold,                                   │
  expiry                                       ┌────────┴────────┐
                                               │                 │
                                        auto-approve      human approval
                                        (settle now)      (WhatsApp / web)
                                               │                 │
                                               └────────┬────────┘
                                                        v
                                            Funding Engine: verify collateral
                                            in AvelaVault → settle via
                                            AvelaPaymentRouter (same paymentId)
                                                        │
                                                        v
                                            AgentSpendingLog + receipt
                                            (agent id, permission snapshot,
                                             collateral asset, tx hash)
```

## Permission scope

```ts
type AgentPermission = {
  maxPerTransaction: number   // Max USD per single payment
  maxPerDay: number           // Max USD per rolling 24h
  allowedAssets: string[]     // e.g. ['wSPYx'] — empty = all
  allowedRecipients: string[] // Wallet addresses — empty = any
  requiresApproval: boolean   // Always require human sign-off?
  approvalThreshold: number   // Auto-approve below, require approval above
}
```

Demo agent (MVP): **$50/tx · $200/day · `wSPYx` only · approval above $25 · 30-day expiry.**

Portable-policy principle: Avela defines the policy language. Where a wallet provider supports spending controls, Avela compiles to their format; otherwise Avela enforces before calling the provider. The policy travels even if the provider changes.

## Lifecycle (API + domain)

| Operation | API | Domain (`packages/core`) |
|---|---|---|
| Register | `POST /agents` | `registerAgent({ accountId, name, walletAddress, permissions, expiresAt? })` |
| Read / list | `GET /agents/:id/permissions`, `GET /accounts/:id/agents` | `getAgent`, `getAgentsByAccount` |
| Update scope | `PATCH /agents/:id/permissions` | `updateAgentPermissions` |
| Revoke | `POST /agents/:id/revoke` | `revokeAgent` (immediate — no new payments) |
| Evaluate | (internal, pre-payment) | `evaluateAgentPermission({ agentId, amount, asset?, recipient })` → `{ allowed, requiresApproval, violations[], dailySpent, dailyRemaining }` |
| Audit | `GET /agents/:id/spending-log` | `logAgentSpending` / `getAgentSpendingLog` (with `permissionSnapshot`) |

Agent statuses: `active | suspended | expired | revoked`. Expired/revoked agents cannot create payments — evaluation fails closed.

## Evaluation rules (fail-closed)

1. Agent must exist and be `active` (not expired/suspended/revoked).
2. `amount <= maxPerTransaction`, else violation.
3. Rolling-24h spend + `amount <= maxPerDay`, else violation.
4. `asset ∈ allowedAssets` (if allowlist non-empty), else violation.
5. `recipient ∈ allowedRecipients` (if allowlist non-empty), else violation.
6. `requiresApproval = requiresApproval flag || amount > approvalThreshold` → intent parks in `awaiting_approval` and routes to WhatsApp/web.

## Agent payment flow (MVP)

1. User grants permission in the dashboard (agent permission screen).
2. Agent checks scope: `avela.getPermissions` (MCP) or `GET /agents/:id/permissions`.
3. Agent checks funds: `avela.getBalance` (MCP) or `GET /accounts/:id/portfolio`.
4. Agent creates intent: `avela.createPaymentIntent` (MCP) or `POST /payments/intent` with `agentId` — permission evaluated synchronously.
5. Over-threshold → user gets a WhatsApp approval request (`Approve` / `Reject` buttons); under-threshold → auto-approved.
6. Settlement runs the standard Funding Engine path (collateral verify → router `executePayment`).
7. Receipt shows agent identity, permission used, collateral asset, `paymentId`, tx hash. Entry appended to the agent spending log.

## Dashboard surface

The permission dashboard (`apps/web`) renders: agent list + status, current scope per agent, daily spend vs. cap, spending log, and edit/revoke controls. Success = a judge can see *what the agent can and cannot do* at a glance.

## Out of scope (roadmap)

Multi-agent orchestration, agent-to-agent commerce, discovery marketplace, dynamic permission negotiation — Phase 3/4. The evaluation + logging primitives here are the foundation they build on.
