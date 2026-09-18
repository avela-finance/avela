import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { LiquidityAdapter } from "../adapters/liquidity.adapter.js";
import type { PriceAdapter } from "../adapters/price.adapter.js";
import type { SettlementAdapter } from "../adapters/settlement.adapter.js";
import type { Database } from "../db/client.js";
import { paymentIntents } from "../schema/payment-intent.js";
import type { PaymentIntentId } from "../types.js";
import { CreatePaymentIntentInput, PaymentState } from "../types.js";

export class PaymentService {
	constructor(
		private db: Database,
		// biome-ignore lint/correctness/noUnusedPrivateClassMembers: reserved for executePayment
		private _priceAdapter: PriceAdapter,
		// biome-ignore lint/correctness/noUnusedPrivateClassMembers: reserved for executePayment
		private _liquidityAdapter: LiquidityAdapter,
		// biome-ignore lint/correctness/noUnusedPrivateClassMembers: reserved for executePayment
		private _settlementAdapter: SettlementAdapter,
	) {}

	async createIntent(input: unknown) {
		const parsed = CreatePaymentIntentInput.parse(input);
		const id = ulid() as PaymentIntentId;

		const existing = await this.db
			.select()
			.from(paymentIntents)
			.where(eq(paymentIntents.idempotencyKey, parsed.idempotencyKey));

		if (existing.length > 0) {
			return existing[0];
		}

		const [intent] = await this.db
			.insert(paymentIntents)
			.values({
				id,
				accountId: parsed.accountId,
				recipientAddress: parsed.recipientAddress,
				amount: parsed.amount,
				currency: parsed.currency,
				memo: parsed.memo ?? null,
				idempotencyKey: parsed.idempotencyKey,
				state: PaymentState.draft,
			})
			.returning();

		return intent;
	}

	async getPayment(id: PaymentIntentId) {
		const [intent] = await this.db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
		return intent ?? null;
	}

	// TODO: Full executePayment orchestration — requires adapter verification on X Layer
	// TODO: approvePayment — requires approval service integration
	// TODO: getReceipt — query receipts table by payment intent ID
}
