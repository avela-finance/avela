import { inArray, eq } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { watchersTable } from "../db/schema.js";
import type { Watcher, WatcherEvaluation } from "./types.js";

type SpendingPowerResult = { totalSpendingPower: number };
type GetSpendingPowerFn = (db: Database, accountId: string) => Promise<SpendingPowerResult>;
type SendAlertFn = (accountId: string, message: string) => Promise<void>;

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
	const now = new Date();

	// --- WATCH: Fetch watcher state ---
	const rows = await db
		.select()
		.from(watchersTable)
		.where(eq(watchersTable.id, watcherId));
	const watcher = (rows[0] as Watcher) ?? undefined;

	if (!watcher) {
		return { watcherId, currentValue: 0, threshold: 0, triggered: false, evaluatedAt: now };
	}

	// Skip non-active and non-triggered watchers (paused, disabled)
	if (watcher.status !== "active" && watcher.status !== "triggered") {
		return {
			watcherId,
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

	// --- EXECUTE: Send notification and update state ---
	if (shouldAlert) {
		const message =
			`Your spending power is now $${currentValue.toFixed(2)} ` +
			`(threshold: $${threshold.toFixed(2)}). ` +
			`It has dropped below your alert level.`;

		await sendAlert(watcher.accountId, message);

		await db
			.update(watchersTable)
			.set({
				status: "triggered",
				lastEvaluatedAt: now,
				lastTriggeredAt: now,
				updatedAt: now,
			})
			.where(eq(watchersTable.id, watcherId));
	} else {
		// Always update lastEvaluatedAt
		await db
			.update(watchersTable)
			.set({ lastEvaluatedAt: now, updatedAt: now })
			.where(eq(watchersTable.id, watcherId));
	}

	return {
		watcherId,
		currentValue,
		threshold,
		triggered: shouldAlert,
		evaluatedAt: now,
	};
}

/**
 * Evaluates all active and triggered watchers sequentially.
 */
export async function evaluateAllActiveWatchers(
	db: Database,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation[]> {
	// Single query using inArray for both statuses
	const rows = await db
		.select()
		.from(watchersTable)
		.where(inArray(watchersTable.status, ["active", "triggered"]));

	const allWatchers = rows as Watcher[];

	const results: WatcherEvaluation[] = [];
	for (const watcher of allWatchers) {
		const result = await evaluateWatcher(db, watcher.id, getSpendingPower, sendAlert);
		results.push(result);
	}

	return results;
}
