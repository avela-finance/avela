# Spec: WhatsApp Access

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §7.5. Messaging as a primary account interface — not a support channel.

## Objective

WhatsApp bot via the WhatsApp Business API that provides account access where the user already is. Check balances, view spending power, approve/reject pending payments, and receive notifications — without opening the web app. This demonstrates "messaging-native" access: the account lives in the conversation.

## Scope

**In:**
- WhatsApp Business API integration (message templates, interactive messages)
- Link WhatsApp number to Avela account (one-time setup)
- Interactive message templates: balance check, spending power, payment history
- Inline approval: pending payment notification with interactive Approve/Reject buttons
- Payment receipt notifications delivered in-conversation
- Spending power alert delivery (from watcher feature)
- Agent spending approval requests routed to WhatsApp

**Out:**
- Full account management (deposit/withdraw via WhatsApp)
- Telegram (evaluated, WhatsApp chosen for MVP)
- Natural language processing / AI chat (Phase 2+)
- Group chat operations
- Payment initiation from WhatsApp (web-only for MVP)

## Domain Model

```ts
type WhatsAppLink = {
  id: string
  accountId: string
  phoneNumber: string         // E.164 format (+1234567890)
  waId: string                // WhatsApp's internal user ID
  linkedAt: Date
  active: boolean
}

type WhatsAppNotification = {
  id: string
  accountId: string
  phoneNumber: string
  type: 'payment_pending' | 'payment_settled' | 'payment_failed'
      | 'spending_alert' | 'agent_approval_request'
  paymentIntentId: string | null
  templateName: string        // WhatsApp message template name
  message: string
  interactiveActions: InteractiveAction[] | null
  sentAt: Date
  respondedAt: Date | null
  response: 'approved' | 'rejected' | null
}

type InteractiveAction = {
  type: 'button'              // WhatsApp interactive button
  title: string               // e.g. 'Approve' or 'Reject'
  id: string                  // e.g. 'approve:payment_01JXYZ'
}
```

## Interfaces

### Message Templates (pre-approved via WhatsApp Business API)

| Template | Trigger | Content |
|----------|---------|---------|
| `welcome` | Account linked | Welcome message + quick actions |
| `balance_update` | User requests | Portfolio positions + values |
| `spending_power` | User requests | Per-asset breakdown + total |
| `payment_approval` | Pending payment | Amount, source, recipient + Approve/Reject buttons |
| `payment_receipt` | Payment settled | Amount, tx hash, settlement details |
| `spending_alert` | Watcher triggered | Current value, threshold, change context |

### Interactive Messages

WhatsApp interactive messages replace slash commands:

```
📊 Your Avela Balance
Portfolio: $3,200 across 3 assets
├ wSPYx: 2.5 shares ($1,400)
├ wQQQx: 1.8 shares ($920)
└ wNVDAx: 6.2 shares ($880)
Spending power: $1,600

[View Portfolio]  [Check Payments]

---

🔔 Approval Request
Agent "Trading Bot" wants to spend $12.00
Source: wSPYx → USDG
Recipient: 0x1234...5678

[✅ Approve]  [❌ Reject]

---

✅ Payment Settled
$12.00 paid to 0x1234...5678
Source: wSPYx (0.022 shares)
Settlement: USDG
Tx: 0xabcd...ef01

[View Receipt]
```

### User-Initiated Messages

When a user sends a text message to the bot, pattern-match common intents:

| Message | Response |
|---------|----------|
| "balance" / "how much" | Send balance template |
| "spending" / "how much can I spend" | Send spending power template |
| "payments" / "history" | Send last 5 payments |
| "help" | Send quick action list |
| Unrecognized | "I can help with: balance, spending power, payments. Or visit app.useavela.xyz" |

### Core Functions

```ts
// WhatsApp link management
linkWhatsAppAccount(accountId: string, phoneNumber: string, waId: string): Promise<WhatsAppLink>
unlinkWhatsAppAccount(accountId: string): Promise<void>
getWhatsAppLink(accountId: string): Promise<WhatsAppLink | null>
getAccountByPhoneNumber(phoneNumber: string): Promise<Account | null>

// Notifications
sendPaymentApprovalRequest(paymentIntentId: string): Promise<void>
sendPaymentReceipt(paymentIntentId: string): Promise<void>
sendSpendingAlert(accountId: string, message: string): Promise<void>

// Webhook callback handling
handleApproval(paymentIntentId: string, phoneNumber: string): Promise<void>
handleRejection(paymentIntentId: string, phoneNumber: string): Promise<void>
handleIncomingMessage(phoneNumber: string, text: string): Promise<void>
```

### Webhook

WhatsApp Business API uses webhooks (not polling):

```
POST /webhooks/whatsapp    — Incoming messages + delivery status + button callbacks
GET  /webhooks/whatsapp    — Webhook verification (challenge response)
```

## Dependencies

- **core-account** — account data, portfolio, spending power
- **funding-engine** — payment intent status, trigger execution on approval
- **spending-policy** — approval threshold determines which payments need WhatsApp approval
- **agent-permissions** — agent approval requests forwarded to WhatsApp
- **WhatsApp Business API** — via provider (Twilio, direct Meta Cloud API, or 360dialog)

## Project Structure

```
apps/api/src/
├── integrations/
│   └── whatsapp/
│       ├── client.ts          — WhatsApp Business API client
│       ├── webhook.ts         — Incoming webhook handler
│       ├── messages.ts        — User message intent matching
│       ├── notifications.ts   — Send notifications to linked users
│       └── templates.ts       — Message template builders
```

## Success Criteria

1. Webhook receives and verifies WhatsApp messages
2. User sends "balance" → receives portfolio data from their account
3. User sends "spending" → receives spending power with per-asset breakdown
4. Pending payment sends interactive approval/reject buttons to WhatsApp
5. Tapping Approve in WhatsApp triggers payment execution
6. Tapping Reject cancels the payment
7. Payment settlement receipt delivered in-conversation
8. Spending power alert (from watcher) delivered via WhatsApp
9. Agent approval request routed to WhatsApp with details
10. Unrecognized messages get a helpful fallback response

## Open Questions

- WhatsApp Business API provider: Twilio (easy, higher cost) vs Meta Cloud API directly (free tier, more setup) vs 360dialog?
- Message template approval: WhatsApp requires pre-approved templates for business-initiated messages — how long is the approval process?
- Link flow: user enters phone number in web app → receives verification code via WhatsApp?
- Phone number verification: OTP via WhatsApp message, or trust Privy's phone auth?
