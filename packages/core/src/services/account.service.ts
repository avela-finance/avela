import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { accounts } from "../schema/account.js";
import { fundingPolicies } from "../schema/funding-policy.js";
import { portfolioPositions } from "../schema/portfolio.js";
import type { AccountId } from "../types.js";
import { CreateAccountInput, UpdateFundingPolicyInput } from "../types.js";

export class AccountService {
	constructor(private db: Database) {}

	async create(input: unknown) {
		const parsed = CreateAccountInput.parse(input);
		const id = ulid() as AccountId;
		const [account] = await this.db
			.insert(accounts)
			.values({
				id,
				externalUserId: parsed.externalUserId,
				name: parsed.name,
				type: parsed.type,
				walletAddress: parsed.walletAddress,
			})
			.returning();
		return account;
	}

	async getById(id: AccountId) {
		const [account] = await this.db.select().from(accounts).where(eq(accounts.id, id));
		return account ?? null;
	}

	async getPortfolio(accountId: AccountId) {
		return this.db
			.select()
			.from(portfolioPositions)
			.where(eq(portfolioPositions.accountId, accountId));
	}

	async getFundingPolicy(accountId: AccountId) {
		const [policy] = await this.db
			.select()
			.from(fundingPolicies)
			.where(eq(fundingPolicies.accountId, accountId));
		return policy ?? null;
	}

	async updateFundingPolicy(input: unknown) {
		const parsed = UpdateFundingPolicyInput.parse(input);
		const id = ulid();
		const [policy] = await this.db
			.insert(fundingPolicies)
			.values({
				id,
				accountId: parsed.accountId,
				reserveMinimum: parsed.reserveMinimum,
				approvalThreshold: parsed.approvalThreshold,
				dailyCap: parsed.dailyCap,
				priceFloor: parsed.priceFloor,
				executionLimit: parsed.executionLimit,
			})
			.onConflictDoUpdate({
				target: fundingPolicies.accountId,
				set: {
					reserveMinimum: parsed.reserveMinimum,
					approvalThreshold: parsed.approvalThreshold,
					dailyCap: parsed.dailyCap,
					priceFloor: parsed.priceFloor,
					executionLimit: parsed.executionLimit,
				},
			})
			.returning();
		return policy;
	}
}
