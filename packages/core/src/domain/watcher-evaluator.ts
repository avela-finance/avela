import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { watchersTable } from "../db/schema.js";
import type { Watcher, WatcherEvaluation } from "./types.js";

type SpendingPowerResult = { totalSpendingPower: number };
type GetSpendingPowerFn = (db: Database, accountId: string) => Promise<SpendingPowerResult>;
type SendAlertFn = (accountId: string, message: string) => Promise<void>;

/**
 * Internal: operates on a pre-fetched watcher to avoid N+1 re-fetches.
 */
async function evaluateWatcherInternal(
	db: Database,
	watcher: Watcher,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation> {
	const now = new Date();

	// Skip non-active and non-triggered watchers (paused, disabled)
	if (watcher.status !== "active" && watcher.status !== "triggered") {
		return {
			watcherId: watcher.id,
			currentValue: 0,
			threshold: watcher.config.threshold,
			triggered: false,
			evaluatedAt: now,
		};
	}

	// --- EVALUATE: Get current spending power and compare ---
	const spendingPower = await getSpendingPower(db, watcher.accountId);
	const currentValue = spendingPower.totalSpendingPower;
	const threshold = watcher.config.threshold;
	const breached = currentValue < threshold;

	// --- DECIDE: Should we alert? ---
	let shouldAlert = false;
	if (breached) {
		const inCooldown =
			watcher.lastTriggeredAt !== null &&
			now.getTime() - watcher.lastTriggeredAt.getTime() < watcher.cooldownMinutes * 60 * 1000;

		shouldAlert = !inCooldown;
	}

	// --- AUTHORIZE: Alert notifications are auto-authorized (no human approval needed) ---

	// --- EXECUTE: Update state then send notification ---
	if (shouldAlert) {
		// Update DB first to claim cooldown window (prevents duplicate alerts on retry)
		await db
			.update(watchersTable)
			.set({
				status: "triggered",
				lastEvaluatedAt: now,
				lastTriggeredAt: now,
				updatedAt: now,
			})
			.where(eq(watchersTable.id, watcher.id));

		// Then send alert (if this fails, cooldown prevents duplicate on retry)
		const message =
			`Your spending power is now $${currentValue.toFixed(2)} ` +
			`(threshold: $${threshold.toFixed(2)}). ` +
			`It has dropped below your alert level.`;

		await sendAlert(watcher.accountId, message);
	} else {
		// Always update lastEvaluatedAt; reset to active if recovered from triggered state
		const updates: Record<string, unknown> = { lastEvaluatedAt: now, updatedAt: now };
		if (!breached && watcher.status === "triggered") {
			updates.status = "active";
		}
		await db.update(watchersTable).set(updates).where(eq(watchersTable.id, watcher.id));
	}

	return {
		watcherId: watcher.id,
		currentValue,
		threshold,
		triggered: shouldAlert,
		evaluatedAt: now,
	};
}

/**
 * WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE
 *
 * Evaluates a single watcher against current spending power.
 * Sends alert and updates state if threshold is breached and not in cooldown.
 */
export async function evaluateWatcher(
	db: Database,
	watcherId: string,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation> {
	const rows = await db.select().from(watchersTable).where(eq(watchersTable.id, watcherId));
	const watcher = rows[0] as Watcher | undefined;

	if (!watcher) {
		throw new Error(`Watcher ${watcherId} not found`);
	}

	return evaluateWatcherInternal(db, watcher, getSpendingPower, sendAlert);
}

/**
 * Evaluates all active and triggered watchers sequentially.
 */
export async function evaluateAllActiveWatchers(
	db: Database,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation[]> {
	const rows = await db
		.select()
		.from(watchersTable)
		.where(inArray(watchersTable.status, ["active", "triggered"]))
		.orderBy(asc(watchersTable.createdAt));

	const allWatchers = rows as Watcher[];

	const results: WatcherEvaluation[] = [];
	for (const watcher of allWatchers) {
		const result = await evaluateWatcherInternal(db, watcher, getSpendingPower, sendAlert);
		results.push(result);
	}

	return results;
}
