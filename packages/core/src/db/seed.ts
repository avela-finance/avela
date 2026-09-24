/**
 * Seed a demo account with positions, stablecoins, policy, agent, and watcher.
 *
 * Usage: bun run seed  (requires DATABASE_URL)
 *
 * Idempotent: exits early if the demo wallet already has an account.
 * Pass --force to wipe and reseed the demo account.
 */
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { createAccount, getAccountByWallet } from "../domain/account.js";
import { registerAgent } from "../domain/agent.js";
import { recordDeposit } from "../domain/position.js";
import { createDefaultPolicy, updatePolicy } from "../domain/spending-policy.js";
import { createWatcher } from "../domain/watcher.js";
import { createDb } from "./client.js";
import {
	agentsTable,
	positionsTable,
	spendingPoliciesTable,
	stablecoinBalancesTable,
	watchersTable,
} from "./schema.js";

const DEMO_WALLET = "0x1234567890AbcdEF1234567890aBcdef12345678";
const DEMO_AGENT_WALLET = "0xAbcdEF1234567890AbcdEF1234567890AbcdEF12";
const DEMO_MERCHANT = "0x000000000000000000000000000000000000dEaD";

// ~$2 of each asset at Sep-2026 verified prices (18 decimals).
const DEMO_POSITIONS: Array<{ assetSymbol: string; amount: bigint }> = [
	{ assetSymbol: "wSPYx", amount: 2_600_000_000_000_000n }, // ~$2.00 @ $771
	{ assetSymbol: "wQQQx", amount: 2_700_000_000_000_000n }, // ~$2.00 @ $743
	{ assetSymbol: "wNVDAx", amount: 8_900_000_000_000_000n }, // ~$2.00 @ $225
	{ assetSymbol: "wGOOGLx", amount: 5_900_000_000_000_000n }, // ~$2.00 @ $339
	{ assetSymbol: "wAAPLx", amount: 6_000_000_000_000_000n }, // ~$2.02 @ $337
];

function seedTxHash(n: number): string {
	return `0x${"seed".padEnd(62, String(n))}`.slice(0, 66).padEnd(66, "0");
}

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error("DATABASE_URL is required");
	const force = process.argv.includes("--force");

	const db = createDb(databaseUrl);
	const existing = await getAccountByWallet(db, DEMO_WALLET);

	if (existing && !force) {
		console.log(`Demo account already exists: ${existing.id} (use --force to reseed)`);
		return;
	}

	let accountId: string;
	if (existing && force) {
		accountId = existing.id;
		await db.delete(watchersTable).where(eq(watchersTable.accountId, accountId));
		await db.delete(agentsTable).where(eq(agentsTable.accountId, accountId));
		await db.delete(positionsTable).where(eq(positionsTable.accountId, accountId));
		await db
			.delete(stablecoinBalancesTable)
			.where(eq(stablecoinBalancesTable.accountId, accountId));
		await db
			.delete(spendingPoliciesTable)
			.where(eq(spendingPoliciesTable.accountId, accountId));
		console.log(`Cleared demo account ${accountId}`);
	} else {
		const account = await createAccount(db, DEMO_WALLET);
		accountId = account.id;
		console.log(`Created demo account ${accountId}`);
	}

	for (const [i, position] of DEMO_POSITIONS.entries()) {
		await recordDeposit(db, {
			accountId,
			assetSymbol: position.assetSymbol,
			amount: position.amount,
			depositTxHash: seedTxHash(i),
		});
	}
	console.log(`Seeded ${DEMO_POSITIONS.length} positions (~$10)`);

	// Stablecoins: 6 decimals on X Layer (verified onchain).
	for (const stablecoin of ["USDG", "USDC"] as const) {
		await db.insert(stablecoinBalancesTable).values({
			id: ulid(),
			accountId,
			stablecoin,
			amount: 5_000_000,
			updatedAt: new Date(),
		});
	}
	console.log("Seeded $5 USDG + $5 USDC");

	await createDefaultPolicy(db, accountId);
	await updatePolicy(db, accountId, { dailyLimit: 50, approvalThreshold: 25 });
	console.log("Seeded spending policy (daily $50, approval threshold $25)");

	await registerAgent(db, {
		accountId,
		name: "Demo Agent",
		walletAddress: DEMO_AGENT_WALLET,
		permissions: {
			maxPerTransaction: 25,
			maxPerDay: 50,
			allowedAssets: ["wSPYx", "wQQQx", "wNVDAx", "wGOOGLx", "wAAPLx"],
			allowedRecipients: [DEMO_MERCHANT],
			requiresApproval: true,
			approvalThreshold: 10,
		},
	});
	console.log("Registered demo agent");

	await createWatcher(db, { accountId, threshold: 5, cooldownMinutes: 60 });
	console.log("Seeded spending-power watcher (alert below $5)");

	console.log("Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
