import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { watchersTable } from "../db/schema.js";
import type { Watcher, CreateWatcherInput } from "./types.js";
import { CreateWatcherInputSchema, WatcherStatusEnum } from "./types.js";

export async function createWatcher(db: Database, input: CreateWatcherInput): Promise<Watcher> {
	const validated = CreateWatcherInputSchema.parse(input);

	const id = ulid();
	const now = new Date();

	const [watcher] = await db
		.insert(watchersTable)
		.values({
			id,
			accountId: validated.accountId,
			type: "spending_power_threshold",
			config: {
				threshold: validated.threshold,
				direction: "below" as const,
			},
			status: "active",
			lastEvaluatedAt: null,
			lastTriggeredAt: null,
			cooldownMinutes: validated.cooldownMinutes,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	return watcher as Watcher;
}

export async function getWatcher(db: Database, watcherId: string): Promise<Watcher | null> {
	const rows = await db
		.select()
		.from(watchersTable)
		.where(eq(watchersTable.id, watcherId));
	return (rows[0] as Watcher) ?? null;
}

export async function getWatchersByAccount(db: Database, accountId: string): Promise<Watcher[]> {
	const rows = await db
		.select()
		.from(watchersTable)
		.where(eq(watchersTable.accountId, accountId));
	return rows as Watcher[];
}

export async function updateWatcher(
	db: Database,
	watcherId: string,
	updates: {
		threshold?: number;
		cooldownMinutes?: number;
		status?: "active" | "triggered" | "paused" | "disabled";
	},
): Promise<Watcher> {
	const setValues: Record<string, unknown> = { updatedAt: new Date() };

	if (updates.threshold !== undefined) {
		setValues.config = { threshold: updates.threshold, direction: "below" };
	}
	if (updates.cooldownMinutes !== undefined) {
		setValues.cooldownMinutes = updates.cooldownMinutes;
	}
	if (updates.status !== undefined) {
		WatcherStatusEnum.parse(updates.status);
		setValues.status = updates.status;
	}

	const [updated] = await db
		.update(watchersTable)
		.set(setValues)
		.where(eq(watchersTable.id, watcherId))
		.returning();

	if (!updated) {
		throw new Error(`Watcher ${watcherId} not found`);
	}

	return updated as Watcher;
}

export async function deleteWatcher(db: Database, watcherId: string): Promise<void> {
	await db.delete(watchersTable).where(eq(watchersTable.id, watcherId));
}
