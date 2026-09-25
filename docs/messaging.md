# Avela Messaging — the account lives in the conversation

> Messaging is a **primary access surface**, not a support channel. Money moves through messages: check balances, approve payments, receive receipts and alerts — without opening the app. MVP surface is **WhatsApp** (Telegram evaluated, WhatsApp chosen).

Related: [`docs/agents.md`](agents.md) · [`docs/mcp.md`](mcp.md)

## What works in MVP

| Action | How | Result |
|---|---|---|
| Check balance | Send `"balance"` / `"how much"` | Portfolio positions + values |
| Check spending power | Send `"spending"` / `"how much can I spend"` | Per-asset breakdown + total |
| Recent payments | Send `"payments"` / `"history"` | Last 5 payments |
| Help | Send `"help"` | Quick action list |
| Approve / reject | Tap inline buttons on an approval request | Payment executes or cancels |
| Receipts | Automatic on settlement | Amount, source, tx hash |
| Spending alerts | Automatic from watcher | Current value, threshold, change context |
| Agent approvals | Automatic when agent exceeds auto-approve threshold | Agent name, amount, source, recipient + buttons |

Unrecognized text gets a helpful fallback (`"I can help with: balance, spending power, payments. Or visit app.useavela.xyz"`). No NLP in MVP — pattern-matched intents only. No deposit/withdraw, no payment initiation from WhatsApp (web-only for MVP).

## Message shapes

**Balance / spending power** — portfolio snapshot with per-asset lines and total spending power, plus `[View Portfolio] [Check Payments]` actions.

**Approval request** — agent name, amount, source asset → settlement token, recipient, plus `[Approve] [Reject]`. Callback ids: `approve:<paymentId>` / `reject:<paymentId>`.

**Receipt** — amount, source shares, settlement token, tx hash, `[View Receipt]`.

**Spending alert** (from watcher) — e.g. *"Your spending power is now $480 (was $620). wSPYx down 8% today."* with suggested next actions.

## Templates (WhatsApp Business API, pre-approved)

| Template | Trigger |
|---|---|
| `welcome` | Account linked |
| `balance_update` | User requests balance |
| `spending_power` | User requests spending power |
| `payment_approval` | Pending payment (with Approve/Reject buttons) |
| `payment_receipt` | Payment settled |
| `spending_alert` | Watcher triggered |

Business-initiated messages must use pre-approved templates — factor approval lead time into launch planning.

## Implementation map

```text
apps/api/src/integrations/whatsapp/
├── client.ts         — WhatsApp Business API client (send text / interactive)
├── webhook.ts        — POST /webhooks/whatsapp (messages + status + callbacks)
│                       GET  /webhooks/whatsapp (challenge verification)
├── messages.ts       — matchIntent(text) → balance | spending_power | payments | help | unknown
├── notifications.ts  — formatBalanceMessage / formatSpendingPowerMessage / receipts / alerts
├── callbacks.ts      — handleButtonCallback (approve:<id> / reject:<id>)
└── templates.ts      — template builders

packages/core/src/domain/whatsapp.ts — WhatsAppLink entity, link/unlink,
                                       phone → account resolution, notification records
```

Wiring (`apps/api/src/index.ts`): the webhook route mounts **only** when `WHATSAPP_VERIFY_TOKEN` is set — otherwise disabled with a console warning. Approval callbacks call the same `executePayment` path as web approvals; rejection sets intent status to `rejected`.

## Link flow

1. User enters phone number in web app → `POST /integrations/whatsapp/link`.
2. `WhatsAppLink { accountId, phoneNumber (E.164), waId, linkedAt, active }` created.
3. User messages the bot → resolved via `getAccountByPhoneNumber` → intents answered against *their* account.

Open questions (provider choice Twilio vs. Meta Cloud API vs. 360dialog, template approval timeline, OTP vs. Privy phone auth) are tracked in the spec.

## Cross-channel continuity

Start a payment on web → approve in WhatsApp → see the receipt in both. Every state change fans out to all linked surfaces — the account is the anchor, messaging is one of its faces.
