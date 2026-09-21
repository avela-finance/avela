import { and, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { positionsTable } from "../db/schema.js";
import { isAssetEligible } from "./asset.js";
import type { Position } from "./types.js";

export type RecordDepositParams = {
	accountId: string;
	assetSymbol: string;
	amount: bigint;
	depositTxHash: string;
};

export async function recordDeposit(db: Database, params: RecordDepositParams): Promise<Position> {
	if (!isAssetEligible(params.assetSymbol)) {
		throw new Error(`Asset ${params.assetSymbol} is not eligible`);
	}
	if (params.amount <= 0n) {
		throw new Error("Deposit amount must be positive");
	}

	const now = new Date();
	const row = {
		id: ulid(),
		accountId: params.accountId,
		assetSymbol: params.assetSymbol,
		amount: params.amount,
		depositTxHash: params.depositTxHash,
		createdAt: now,
		updatedAt: now,
	};

	const [inserted] = await db.insert(positionsTable).values(row).returning();
	return inserted as Position;
}

export type RecordWithdrawalParams = {
	accountId: string;
	positionId: string;
	amount: bigint;
};

export async function recordWithdrawal(
	db: Database,
	params: RecordWithdrawalParams,
): Promise<Position> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.select()
			.from(positionsTable)
			.where(
				and(
					eq(positionsTable.id, params.positionId),
					eq(positionsTable.accountId, params.accountId),
				),
			);
		const position = rows[0];

		if (!position) {
			throw new Error(`Position ${params.positionId} not found`);
		}
		if (position.amount < params.amount) {
			throw new Error("Withdrawal amount exceeds position balance");
		}

		const newAmount = position.amount - params.amount;
		const now = new Date();

		const [updated] = await tx
			.update(positionsTable)
			.set({ amount: newAmount, updatedAt: now })
			.where(
				and(
					eq(positionsTable.id, params.positionId),
					eq(positionsTable.accountId, params.accountId),
				),
			)
			.returning();

		return updated as Position;
	});
}

export async function getPortfolio(db: Database, accountId: string): Promise<Position[]> {
	const rows = await db
		.select()
		.from(positionsTable)
		.where(eq(positionsTable.accountId, accountId));
	return rows as Position[];
}
