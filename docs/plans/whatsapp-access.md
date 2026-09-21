# WhatsApp Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp Business API integration so users can check balances, approve/reject payments, and receive notifications from their Avela account via WhatsApp.

**Architecture:** A WhatsApp integration module inside the API app handles inbound webhooks (Meta Cloud API) and outbound notifications. Domain logic (link management) lives in `packages/core`. The webhook route is public (verified by Meta's challenge); all other actions go through the linked account.

**Tech Stack:** WhatsApp Business API (Meta Cloud API), Hono routes, Drizzle ORM, Zod, ulidx

## Global Constraints

- Biome: tabs, double quotes, semicolons, trailing commas
- All IDs are ULIDs via `ulidx`
- Zod validation at every domain boundary
- `bun run check` and `bun run test` must pass after every task
- No mocks — but WhatsApp API calls use a client abstraction testable with dependency injection

---

### Task 1: WhatsApp Domain Types

**Files:**
- Modify: `packages/core/src/domain/types.ts`
- Test: `packages/core/src/domain/__tests__/whatsapp.test.ts`

**Interfaces:**
- Consumes: nothing (foundational types)
- Produces: `WhatsAppLink`, `WhatsAppNotification`, `WhatsAppNotificationType`, `InteractiveAction`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/domain/__tests__/whatsapp.test.ts
import { describe, it, expect } from "vitest";
import type {
	WhatsAppLink,
	WhatsAppNotification,
	WhatsAppNotificationType,
	InteractiveAction,
} from "../types.js";

describe("WhatsApp types", () => {
	it("creates a valid WhatsAppLink", () => {
		const link: WhatsAppLink = {
			id: "01JTEST000000000000000000",
			accountId: "01JTEST000000000000000001",
			phoneNumber: "+1234567890",
			waId: "1234567890",
			linkedAt: new Date(),
			active: true,
		};
		expect(link.phoneNumber).toMatch(/^\+\d+$/);
		expect(link.active).toBe(true);
	});

	it("creates a valid WhatsAppNotification", () => {
		const notification: WhatsAppNotification = {
			id: "01JTEST000000000000000002",
			accountId: "01JTEST000000000000000001",
			phoneNumber: "+1234567890",
			type: "payment_pending",
			paymentIntentId: "01JTEST000000000000000003",
			templateName: "payment_approval",
			message: "Agent wants to spend $12.00",
			interactiveActions: [
				{ type: "button", title: "Approve", id: "approve:01JTEST000000000000000003" },
				{ type: "button", title: "Reject", id: "reject:01JTEST000000000000000003" },
			],
			sentAt: new Date(),
			respondedAt: null,
			response: null,
		};
		expect(notification.type).toBe("payment_pending");
		expect(notification.interactiveActions).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/whatsapp.test.ts`
Expected: FAIL — types not exported yet

- [ ] **Step 3: Add types to types.ts**

Append to `packages/core/src/domain/types.ts`:

```ts
// WhatsApp Access
export type WhatsAppNotificationType =
	| "payment_pending"
	| "payment_settled"
	| "payment_failed"
	| "spending_alert"
	| "agent_approval_request";

export type InteractiveAction = {
	type: "button";
	title: string;
	id: string;
};

export type WhatsAppLink = {
	id: string;
	accountId: string;
	phoneNumber: string;
	waId: string;
	linkedAt: Date;
	active: boolean;
};

export type WhatsAppNotification = {
	id: string;
	accountId: string;
	phoneNumber: string;
	type: WhatsAppNotificationType;
	paymentIntentId: string | null;
	templateName: string;
	message: string;
	interactiveActions: InteractiveAction[] | null;
	sentAt: Date;
	respondedAt: Date | null;
	response: "approved" | "rejected" | null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/types.ts packages/core/src/domain/__tests__/whatsapp.test.ts
git commit -m "feat(core): add WhatsApp domain types"
```

---

### Task 2: WhatsApp Database Schema

**Files:**
- Modify: `packages/core/src/db/schema.ts`
- Test: `packages/core/src/db/__tests__/whatsapp-schema.test.ts`

**Interfaces:**
- Consumes: `accounts` table (foreign key)
- Produces: `whatsappLinks` table, `whatsappNotifications` table (Drizzle table definitions)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/__tests__/whatsapp-schema.test.ts
import { describe, it, expect } from "vitest";
import { whatsappLinks, whatsappNotifications } from "../schema.js";

describe("WhatsApp schema", () => {
	it("exports whatsappLinks table with correct columns", () => {
		expect(whatsappLinks).toBeDefined();
		const columns = Object.keys(whatsappLinks);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("phoneNumber");
		expect(columns).toContain("waId");
		expect(columns).toContain("linkedAt");
		expect(columns).toContain("active");
	});

	it("exports whatsappNotifications table with correct columns", () => {
		expect(whatsappNotifications).toBeDefined();
		const columns = Object.keys(whatsappNotifications);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("phoneNumber");
		expect(columns).toContain("type");
		expect(columns).toContain("paymentIntentId");
		expect(columns).toContain("templateName");
		expect(columns).toContain("message");
		expect(columns).toContain("sentAt");
		expect(columns).toContain("response");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/db/__tests__/whatsapp-schema.test.ts`
Expected: FAIL — tables not defined

- [ ] **Step 3: Add table definitions to schema.ts**

Append to `packages/core/src/db/schema.ts`:

```ts
import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const whatsappLinks = pgTable("whatsapp_links", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull().references(() => accounts.id),
	phoneNumber: text("phone_number").notNull().unique(),
	waId: text("wa_id").notNull(),
	linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
	active: boolean("active").notNull().default(true),
});

export const whatsappNotifications = pgTable("whatsapp_notifications", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull().references(() => accounts.id),
	phoneNumber: text("phone_number").notNull(),
	type: text("type").notNull(),
	paymentIntentId: text("payment_intent_id"),
	templateName: text("template_name").notNull(),
	message: text("message").notNull(),
	interactiveActions: jsonb("interactive_actions"),
	sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
	respondedAt: timestamp("responded_at", { withTimezone: true }),
	response: text("response"),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/db/__tests__/whatsapp-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/whatsapp-schema.test.ts
git commit -m "feat(core): add WhatsApp database schema"
```

---

### Task 3: WhatsApp API Client

**Files:**
- Create: `apps/api/src/integrations/whatsapp/client.ts`
- Create: `apps/api/src/integrations/whatsapp/types.ts`
- Test: `apps/api/src/integrations/whatsapp/__tests__/client.test.ts`

**Interfaces:**
- Consumes: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` env vars
- Produces: `WhatsAppClient` with `sendTextMessage()`, `sendInteractiveButtons()`, `sendTemplate()`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/integrations/whatsapp/__tests__/client.test.ts
import { describe, it, expect } from "vitest";
import { createWhatsAppClient } from "../client.js";
import type { WhatsAppClient } from "../types.js";

describe("WhatsAppClient", () => {
	it("creates a client with required config", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		expect(client).toBeDefined();
		expect(client.sendTextMessage).toBeTypeOf("function");
		expect(client.sendInteractiveButtons).toBeTypeOf("function");
		expect(client.sendTemplate).toBeTypeOf("function");
	});

	it("buildTextPayload creates correct structure", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		const payload = client.buildTextPayload("+1234567890", "Hello");
		expect(payload).toEqual({
			messaging_product: "whatsapp",
			to: "+1234567890",
			type: "text",
			text: { body: "Hello" },
		});
	});

	it("buildInteractivePayload creates buttons", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		const payload = client.buildInteractivePayload(
			"+1234567890",
			"Approve payment?",
			[
				{ type: "button", title: "Approve", id: "approve:123" },
				{ type: "button", title: "Reject", id: "reject:123" },
			],
		);
		expect(payload.type).toBe("interactive");
		expect(payload.interactive.type).toBe("button");
		expect(payload.interactive.action.buttons).toHaveLength(2);
		expect(payload.interactive.action.buttons[0].reply.id).toBe("approve:123");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/client.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create WhatsApp client types**

```ts
// apps/api/src/integrations/whatsapp/types.ts
import type { InteractiveAction } from "@avela/core/domain/types";

export type WhatsAppConfig = {
	phoneNumberId: string;
	accessToken: string;
	verifyToken: string;
};

export type WhatsAppTextPayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "text";
	text: { body: string };
};

export type WhatsAppInteractivePayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "interactive";
	interactive: {
		type: "button";
		body: { text: string };
		action: {
			buttons: Array<{
				type: "reply";
				reply: { id: string; title: string };
			}>;
		};
	};
};

export type WhatsAppTemplatePayload = {
	messaging_product: "whatsapp";
	to: string;
	type: "template";
	template: {
		name: string;
		language: { code: string };
		components?: Array<{
			type: "body";
			parameters: Array<{ type: "text"; text: string }>;
		}>;
	};
};

export type WhatsAppWebhookEntry = {
	id: string;
	changes: Array<{
		value: {
			messaging_product: "whatsapp";
			metadata: { display_phone_number: string; phone_number_id: string };
			messages?: Array<{
				from: string;
				id: string;
				timestamp: string;
				type: "text" | "interactive" | "button";
				text?: { body: string };
				interactive?: { type: "button_reply"; button_reply: { id: string; title: string } };
			}>;
			statuses?: Array<{
				id: string;
				status: "sent" | "delivered" | "read" | "failed";
				timestamp: string;
				recipient_id: string;
			}>;
		};
		field: "messages";
	}>;
};

export type WhatsAppClient = {
	sendTextMessage(to: string, body: string): Promise<void>;
	sendInteractiveButtons(
		to: string,
		body: string,
		actions: InteractiveAction[],
	): Promise<void>;
	sendTemplate(
		to: string,
		templateName: string,
		languageCode: string,
		parameters?: string[],
	): Promise<void>;
	buildTextPayload(to: string, body: string): WhatsAppTextPayload;
	buildInteractivePayload(
		to: string,
		body: string,
		actions: InteractiveAction[],
	): WhatsAppInteractivePayload;
};
```

- [ ] **Step 4: Implement the client**

```ts
// apps/api/src/integrations/whatsapp/client.ts
import type { InteractiveAction } from "@avela/core/domain/types";
import type {
	WhatsAppConfig,
	WhatsAppClient,
	WhatsAppTextPayload,
	WhatsAppInteractivePayload,
} from "./types.js";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
	const { phoneNumberId, accessToken } = config;
	const messagesUrl = `${GRAPH_API_URL}/${phoneNumberId}/messages`;

	async function sendPayload(payload: Record<string, unknown>): Promise<void> {
		const response = await fetch(messagesUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			const error = await response.text();
			throw new Error(`WhatsApp API error ${response.status}: ${error}`);
		}
	}

	function buildTextPayload(to: string, body: string): WhatsAppTextPayload {
		return {
			messaging_product: "whatsapp",
			to,
			type: "text",
			text: { body },
		};
	}

	function buildInteractivePayload(
		to: string,
		body: string,
		actions: InteractiveAction[],
	): WhatsAppInteractivePayload {
		return {
			messaging_product: "whatsapp",
			to,
			type: "interactive",
			interactive: {
				type: "button",
				body: { text: body },
				action: {
					buttons: actions.map((a) => ({
						type: "reply" as const,
						reply: { id: a.id, title: a.title },
					})),
				},
			},
		};
	}

	return {
		async sendTextMessage(to: string, body: string): Promise<void> {
			await sendPayload(buildTextPayload(to, body));
		},
		async sendInteractiveButtons(
			to: string,
			body: string,
			actions: InteractiveAction[],
		): Promise<void> {
			await sendPayload(buildInteractivePayload(to, body, actions));
		},
		async sendTemplate(
			to: string,
			templateName: string,
			languageCode: string,
			parameters?: string[],
		): Promise<void> {
			const payload: Record<string, unknown> = {
				messaging_product: "whatsapp",
				to,
				type: "template",
				template: {
					name: templateName,
					language: { code: languageCode },
					...(parameters && {
						components: [
							{
								type: "body",
								parameters: parameters.map((p) => ({ type: "text", text: p })),
							},
						],
					}),
				},
			};
			await sendPayload(payload);
		},
		buildTextPayload,
		buildInteractivePayload,
	};
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/client.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/integrations/whatsapp/client.ts apps/api/src/integrations/whatsapp/types.ts apps/api/src/integrations/whatsapp/__tests__/client.test.ts
git commit -m "feat(api): add WhatsApp Business API client"
```

---

### Task 4: Webhook Handler

**Files:**
- Create: `apps/api/src/integrations/whatsapp/webhook.ts`
- Test: `apps/api/src/integrations/whatsapp/__tests__/webhook.test.ts`

**Interfaces:**
- Consumes: `WhatsAppConfig.verifyToken`, `WhatsAppWebhookEntry`
- Produces: Hono route group mountable at `/webhooks/whatsapp`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/integrations/whatsapp/__tests__/webhook.test.ts
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createWebhookRoutes } from "../webhook.js";

describe("WhatsApp webhook", () => {
	const app = new Hono();
	app.route(
		"/webhooks/whatsapp",
		createWebhookRoutes({
			verifyToken: "test-verify-token",
			onTextMessage: async () => {},
			onButtonReply: async () => {},
		}),
	);

	it("GET verifies the webhook with correct token", async () => {
		const res = await app.request(
			"/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=challenge123",
		);
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toBe("challenge123");
	});

	it("GET rejects incorrect verify token", async () => {
		const res = await app.request(
			"/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge123",
		);
		expect(res.status).toBe(403);
	});

	it("POST returns 200 for valid webhook payload", async () => {
		const payload = {
			object: "whatsapp_business_account",
			entry: [
				{
					id: "BIZ_ID",
					changes: [
						{
							value: {
								messaging_product: "whatsapp",
								metadata: {
									display_phone_number: "+1555000000",
									phone_number_id: "PHONE_ID",
								},
								messages: [
									{
										from: "1234567890",
										id: "wamid.test",
										timestamp: "1234567890",
										type: "text",
										text: { body: "balance" },
									},
								],
							},
							field: "messages",
						},
					],
				},
			],
		};
		const res = await app.request("/webhooks/whatsapp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		expect(res.status).toBe(200);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/webhook.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement webhook routes**

```ts
// apps/api/src/integrations/whatsapp/webhook.ts
import { Hono } from "hono";
import type { WhatsAppWebhookEntry } from "./types.js";

export type WebhookHandlers = {
	verifyToken: string;
	onTextMessage: (from: string, text: string) => Promise<void>;
	onButtonReply: (from: string, buttonId: string) => Promise<void>;
};

export function createWebhookRoutes(handlers: WebhookHandlers): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const mode = c.req.query("hub.mode");
		const token = c.req.query("hub.verify_token");
		const challenge = c.req.query("hub.challenge");

		if (mode === "subscribe" && token === handlers.verifyToken) {
			return c.text(challenge ?? "", 200);
		}
		return c.text("Forbidden", 403);
	});

	app.post("/", async (c) => {
		const body = await c.req.json<{ object: string; entry: WhatsAppWebhookEntry[] }>();

		if (body.object !== "whatsapp_business_account") {
			return c.text("Not Found", 404);
		}

		for (const entry of body.entry) {
			for (const change of entry.changes) {
				const messages = change.value.messages ?? [];
				for (const msg of messages) {
					if (msg.type === "text" && msg.text) {
						await handlers.onTextMessage(msg.from, msg.text.body);
					} else if (
						msg.type === "interactive" &&
						msg.interactive?.type === "button_reply"
					) {
						await handlers.onButtonReply(msg.from, msg.interactive.button_reply.id);
					}
				}
			}
		}

		return c.text("OK", 200);
	});

	return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/webhook.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/integrations/whatsapp/webhook.ts apps/api/src/integrations/whatsapp/__tests__/webhook.test.ts
git commit -m "feat(api): add WhatsApp webhook handler"
```

---

### Task 5: Message Intent Handlers

**Files:**
- Create: `apps/api/src/integrations/whatsapp/messages.ts`
- Test: `apps/api/src/integrations/whatsapp/__tests__/messages.test.ts`

**Interfaces:**
- Consumes: `getAccountByPhoneNumber()`, `calculateSpendingPower()`, `getPortfolio()`, `getPaymentHistory()`
- Produces: `handleIncomingMessage(phoneNumber, text, deps)` → sends WhatsApp reply

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/integrations/whatsapp/__tests__/messages.test.ts
import { describe, it, expect } from "vitest";
import { matchIntent } from "../messages.js";

describe("message intent matching", () => {
	it("matches 'balance' to balance intent", () => {
		expect(matchIntent("balance")).toBe("balance");
	});

	it("matches 'how much' to balance intent", () => {
		expect(matchIntent("how much do I have")).toBe("balance");
	});

	it("matches 'spending' to spending_power intent", () => {
		expect(matchIntent("spending")).toBe("spending_power");
	});

	it("matches 'how much can I spend' to spending_power intent", () => {
		expect(matchIntent("how much can I spend")).toBe("spending_power");
	});

	it("matches 'payments' to payments intent", () => {
		expect(matchIntent("payments")).toBe("payments");
	});

	it("matches 'history' to payments intent", () => {
		expect(matchIntent("history")).toBe("payments");
	});

	it("matches 'help' to help intent", () => {
		expect(matchIntent("help")).toBe("help");
	});

	it("returns unknown for unrecognized messages", () => {
		expect(matchIntent("what is the meaning of life")).toBe("unknown");
	});

	it("is case-insensitive", () => {
		expect(matchIntent("BALANCE")).toBe("balance");
		expect(matchIntent("Spending Power")).toBe("spending_power");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/messages.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement message intent matching**

```ts
// apps/api/src/integrations/whatsapp/messages.ts
export type MessageIntent = "balance" | "spending_power" | "payments" | "help" | "unknown";

const INTENT_PATTERNS: Array<{ intent: MessageIntent; patterns: RegExp[] }> = [
	{
		intent: "balance",
		patterns: [/\bbalance\b/i, /\bhow much\b/i, /\bportfolio\b/i],
	},
	{
		intent: "spending_power",
		patterns: [/\bspending\b/i, /\bspend\b/i, /\bpower\b/i],
	},
	{
		intent: "payments",
		patterns: [/\bpayments?\b/i, /\bhistory\b/i, /\btransactions?\b/i],
	},
	{
		intent: "help",
		patterns: [/\bhelp\b/i, /\bcommands?\b/i, /\bstart\b/i],
	},
];

export function matchIntent(text: string): MessageIntent {
	for (const { intent, patterns } of INTENT_PATTERNS) {
		for (const pattern of patterns) {
			if (pattern.test(text)) {
				return intent;
			}
		}
	}
	return "unknown";
}

export function formatHelpMessage(): string {
	return [
		"I can help with:",
		"• *balance* — view your portfolio",
		"• *spending* — check spending power",
		"• *payments* — recent payment history",
		"",
		"Or visit app.avela.xyz",
	].join("\n");
}

export function formatUnknownMessage(): string {
	return "I didn't understand that. Try *balance*, *spending*, or *payments*. Or visit app.avela.xyz";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/messages.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/integrations/whatsapp/messages.ts apps/api/src/integrations/whatsapp/__tests__/messages.test.ts
git commit -m "feat(api): add WhatsApp message intent matching"
```

---

### Task 6: Notification Sender

**Files:**
- Create: `apps/api/src/integrations/whatsapp/notifications.ts`
- Test: `apps/api/src/integrations/whatsapp/__tests__/notifications.test.ts`

**Interfaces:**
- Consumes: `WhatsAppClient`, `PaymentIntent`, `SpendingPower`, `WhatsAppLink`
- Produces: `sendPaymentApprovalRequest()`, `sendPaymentReceipt()`, `sendSpendingAlert()`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/integrations/whatsapp/__tests__/notifications.test.ts
import { describe, it, expect } from "vitest";
import {
	formatApprovalMessage,
	formatReceiptMessage,
	formatSpendingAlertMessage,
	formatBalanceMessage,
	formatSpendingPowerMessage,
} from "../notifications.js";

describe("notification formatters", () => {
	it("formats approval request message", () => {
		const msg = formatApprovalMessage({
			agentName: "Trading Bot",
			amount: 12.0,
			sourceAsset: "wSPYx",
			settlementCurrency: "USDG",
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});
		expect(msg).toContain("Trading Bot");
		expect(msg).toContain("$12.00");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("0x1234...5678");
	});

	it("formats receipt message", () => {
		const msg = formatReceiptMessage({
			amount: 25.0,
			recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			sourceAsset: "wSPYx",
			sourceAmount: "0.045",
			settlementCurrency: "USDG",
			txHash: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
		});
		expect(msg).toContain("$25.00");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("0.045");
		expect(msg).toContain("0xdead...beef");
	});

	it("formats spending alert message", () => {
		const msg = formatSpendingAlertMessage({
			currentSpendingPower: 480,
			previousSpendingPower: 620,
			threshold: 500,
		});
		expect(msg).toContain("$480");
		expect(msg).toContain("$500");
	});

	it("formats balance message", () => {
		const msg = formatBalanceMessage({
			totalValue: 3200,
			positions: [
				{ symbol: "wSPYx", amount: "2.5", valueUsd: 1400 },
				{ symbol: "wQQQx", amount: "1.8", valueUsd: 920 },
				{ symbol: "wNVDAx", amount: "6.2", valueUsd: 880 },
			],
			totalSpendingPower: 1600,
		});
		expect(msg).toContain("$3,200");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("$1,600");
	});

	it("formats spending power message", () => {
		const msg = formatSpendingPowerMessage({
			perAsset: [
				{ symbol: "wSPYx", value: 1400, haircut: 0.5, spendingPower: 700 },
				{ symbol: "wQQQx", value: 920, haircut: 0.5, spendingPower: 460 },
			],
			stablecoinBalance: 200,
			totalSpendingPower: 1360,
		});
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("$700");
		expect(msg).toContain("$1,360");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/notifications.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement notification formatters**

```ts
// apps/api/src/integrations/whatsapp/notifications.ts

function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(amount: number): string {
	return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatApprovalMessage(params: {
	agentName: string;
	amount: number;
	sourceAsset: string;
	settlementCurrency: string;
	recipientAddress: string;
}): string {
	return [
		"🔔 *Approval Request*",
		`Agent "${params.agentName}" wants to spend ${formatUsd(params.amount)}`,
		`Source: ${params.sourceAsset} → ${params.settlementCurrency}`,
		`Recipient: ${truncateAddress(params.recipientAddress)}`,
	].join("\n");
}

export function formatReceiptMessage(params: {
	amount: number;
	recipientAddress: string;
	sourceAsset: string;
	sourceAmount: string;
	settlementCurrency: string;
	txHash: string;
}): string {
	return [
		"✅ *Payment Settled*",
		`${formatUsd(params.amount)} paid to ${truncateAddress(params.recipientAddress)}`,
		`Source: ${params.sourceAsset} (${params.sourceAmount} shares)`,
		`Settlement: ${params.settlementCurrency}`,
		`Tx: ${truncateAddress(params.txHash)}`,
	].join("\n");
}

export function formatSpendingAlertMessage(params: {
	currentSpendingPower: number;
	previousSpendingPower: number;
	threshold: number;
}): string {
	const change = params.currentSpendingPower - params.previousSpendingPower;
	const direction = change < 0 ? "dropped" : "changed";
	return [
		"⚠️ *Spending Power Alert*",
		`Your spending power ${direction} to ${formatUsd(params.currentSpendingPower)} (threshold: ${formatUsd(params.threshold)})`,
		`Was: ${formatUsd(params.previousSpendingPower)}`,
	].join("\n");
}

export function formatBalanceMessage(params: {
	totalValue: number;
	positions: Array<{ symbol: string; amount: string; valueUsd: number }>;
	totalSpendingPower: number;
}): string {
	const positionLines = params.positions.map(
		(p) => `├ ${p.symbol}: ${p.amount} shares (${formatUsd(p.valueUsd)})`,
	);
	const lastIdx = positionLines.length - 1;
	if (lastIdx >= 0) {
		positionLines[lastIdx] = positionLines[lastIdx]!.replace("├", "└");
	}
	return [
		"📊 *Your Avela Balance*",
		`Portfolio: ${formatUsd(params.totalValue)} across ${params.positions.length} assets`,
		...positionLines,
		`Spending power: ${formatUsd(params.totalSpendingPower)}`,
	].join("\n");
}

export function formatSpendingPowerMessage(params: {
	perAsset: Array<{ symbol: string; value: number; haircut: number; spendingPower: number }>;
	stablecoinBalance: number;
	totalSpendingPower: number;
}): string {
	const assetLines = params.perAsset.map(
		(a) =>
			`├ ${a.symbol}: ${formatUsd(a.value)} × ${(1 - a.haircut) * 100}% = ${formatUsd(a.spendingPower)}`,
	);
	const lastIdx = assetLines.length - 1;
	if (lastIdx >= 0) {
		assetLines[lastIdx] = assetLines[lastIdx]!.replace("├", "└");
	}
	return [
		"💰 *Spending Power*",
		...assetLines,
		...(params.stablecoinBalance > 0
			? [`Stablecoin balance: ${formatUsd(params.stablecoinBalance)}`]
			: []),
		`*Total: ${formatUsd(params.totalSpendingPower)}*`,
	].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/notifications.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/integrations/whatsapp/notifications.ts apps/api/src/integrations/whatsapp/__tests__/notifications.test.ts
git commit -m "feat(api): add WhatsApp notification formatters"
```

---

### Task 7: Link Management Domain Logic

**Files:**
- Create: `packages/core/src/domain/whatsapp.ts`
- Test: `packages/core/src/domain/__tests__/whatsapp-link.test.ts`

**Interfaces:**
- Consumes: `whatsappLinks` table, `accounts` table, `ulid()` from ulidx
- Produces: `linkWhatsAppAccount()`, `unlinkWhatsAppAccount()`, `getWhatsAppLink()`, `getAccountByPhoneNumber()`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/domain/__tests__/whatsapp-link.test.ts
import { describe, it, expect } from "vitest";
import {
	validatePhoneNumber,
	createLinkWhatsAppAccount,
	createGetWhatsAppLink,
	createUnlinkWhatsAppAccount,
	createGetAccountByPhoneNumber,
} from "../whatsapp.js";

describe("validatePhoneNumber", () => {
	it("accepts valid E.164 numbers", () => {
		expect(validatePhoneNumber("+1234567890")).toBe(true);
		expect(validatePhoneNumber("+233201234567")).toBe(true);
	});

	it("rejects invalid numbers", () => {
		expect(validatePhoneNumber("1234567890")).toBe(false);
		expect(validatePhoneNumber("+")).toBe(false);
		expect(validatePhoneNumber("abc")).toBe(false);
		expect(validatePhoneNumber("")).toBe(false);
	});
});

describe("WhatsApp link factories", () => {
	it("exports all factory functions", () => {
		expect(createLinkWhatsAppAccount).toBeTypeOf("function");
		expect(createGetWhatsAppLink).toBeTypeOf("function");
		expect(createUnlinkWhatsAppAccount).toBeTypeOf("function");
		expect(createGetAccountByPhoneNumber).toBeTypeOf("function");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/whatsapp-link.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement link management**

```ts
// packages/core/src/domain/whatsapp.ts
import { ulid } from "ulidx";
import { eq } from "drizzle-orm";
import type { WhatsAppLink } from "./types.js";

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function validatePhoneNumber(phone: string): boolean {
	return E164_REGEX.test(phone);
}

type DbContext = {
	db: {
		insert: (table: unknown) => { values: (v: unknown) => { returning: () => Promise<unknown[]> } };
		select: () => { from: (table: unknown) => { where: (cond: unknown) => Promise<unknown[]> } };
		update: (table: unknown) => {
			set: (v: unknown) => { where: (cond: unknown) => { returning: () => Promise<unknown[]> } };
		};
	};
	tables: {
		whatsappLinks: unknown;
		accounts: unknown;
	};
};

export function createLinkWhatsAppAccount(ctx: DbContext) {
	return async function linkWhatsAppAccount(
		accountId: string,
		phoneNumber: string,
		waId: string,
	): Promise<WhatsAppLink> {
		if (!validatePhoneNumber(phoneNumber)) {
			throw new Error(`Invalid phone number: ${phoneNumber}. Must be E.164 format.`);
		}

		const [link] = (await ctx.db
			.insert(ctx.tables.whatsappLinks)
			.values({
				id: ulid(),
				accountId,
				phoneNumber,
				waId,
				linkedAt: new Date(),
				active: true,
			})
			.returning()) as WhatsAppLink[];

		return link!;
	};
}

export function createGetWhatsAppLink(ctx: DbContext) {
	return async function getWhatsAppLink(accountId: string): Promise<WhatsAppLink | null> {
		const [link] = (await ctx.db
			.select()
			.from(ctx.tables.whatsappLinks)
			.where(eq((ctx.tables.whatsappLinks as any).accountId, accountId))) as WhatsAppLink[];

		return link ?? null;
	};
}

export function createUnlinkWhatsAppAccount(ctx: DbContext) {
	return async function unlinkWhatsAppAccount(accountId: string): Promise<void> {
		await ctx.db
			.update(ctx.tables.whatsappLinks)
			.set({ active: false })
			.where(eq((ctx.tables.whatsappLinks as any).accountId, accountId))
			.returning();
	};
}

export function createGetAccountByPhoneNumber(ctx: DbContext) {
	return async function getAccountByPhoneNumber(
		phoneNumber: string,
	): Promise<{ accountId: string } | null> {
		const [link] = (await ctx.db
			.select()
			.from(ctx.tables.whatsappLinks)
			.where(eq((ctx.tables.whatsappLinks as any).phoneNumber, phoneNumber))) as WhatsAppLink[];

		if (!link || !link.active) return null;
		return { accountId: link.accountId };
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/whatsapp-link.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/whatsapp.ts packages/core/src/domain/__tests__/whatsapp-link.test.ts
git commit -m "feat(core): add WhatsApp link management"
```

---

### Task 8: Callback Handlers (Approve / Reject)

**Files:**
- Create: `apps/api/src/integrations/whatsapp/callbacks.ts`
- Test: `apps/api/src/integrations/whatsapp/__tests__/callbacks.test.ts`

**Interfaces:**
- Consumes: `getAccountByPhoneNumber()`, `getPaymentStatus()`, `executePayment()`, payment intent types
- Produces: `handleButtonCallback(from, buttonId, deps)` → approves or rejects payment and sends WhatsApp confirmation

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/integrations/whatsapp/__tests__/callbacks.test.ts
import { describe, it, expect } from "vitest";
import { parseCallbackAction } from "../callbacks.js";

describe("parseCallbackAction", () => {
	it("parses approve action", () => {
		const result = parseCallbackAction("approve:01JTEST000000000000000003");
		expect(result).toEqual({ action: "approve", paymentIntentId: "01JTEST000000000000000003" });
	});

	it("parses reject action", () => {
		const result = parseCallbackAction("reject:01JTEST000000000000000003");
		expect(result).toEqual({ action: "reject", paymentIntentId: "01JTEST000000000000000003" });
	});

	it("returns null for invalid format", () => {
		expect(parseCallbackAction("invalid")).toBeNull();
		expect(parseCallbackAction("approve:")).toBeNull();
		expect(parseCallbackAction("")).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/callbacks.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement callback parser and handler**

```ts
// apps/api/src/integrations/whatsapp/callbacks.ts
export type CallbackAction = {
	action: "approve" | "reject";
	paymentIntentId: string;
};

export function parseCallbackAction(callbackData: string): CallbackAction | null {
	const parts = callbackData.split(":");
	if (parts.length !== 2) return null;

	const [action, paymentIntentId] = parts;
	if (!action || !paymentIntentId) return null;

	if (action !== "approve" && action !== "reject") return null;

	return { action, paymentIntentId };
}

export type CallbackDeps = {
	getAccountByPhoneNumber: (phone: string) => Promise<{ accountId: string } | null>;
	authorizePayment: (paymentIntentId: string) => Promise<void>;
	rejectPayment: (paymentIntentId: string) => Promise<void>;
	sendTextMessage: (to: string, body: string) => Promise<void>;
};

export async function handleButtonCallback(
	from: string,
	buttonId: string,
	deps: CallbackDeps,
): Promise<void> {
	const parsed = parseCallbackAction(buttonId);
	if (!parsed) {
		await deps.sendTextMessage(from, "Invalid action. Please try again.");
		return;
	}

	const account = await deps.getAccountByPhoneNumber(from);
	if (!account) {
		await deps.sendTextMessage(from, "No Avela account linked to this number.");
		return;
	}

	if (parsed.action === "approve") {
		await deps.authorizePayment(parsed.paymentIntentId);
		await deps.sendTextMessage(from, "✅ Payment approved and executing.");
	} else {
		await deps.rejectPayment(parsed.paymentIntentId);
		await deps.sendTextMessage(from, "❌ Payment rejected.");
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/integrations/whatsapp/__tests__/callbacks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/integrations/whatsapp/callbacks.ts apps/api/src/integrations/whatsapp/__tests__/callbacks.test.ts
git commit -m "feat(api): add WhatsApp callback handlers for payment approval"
```
