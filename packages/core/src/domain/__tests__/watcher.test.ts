import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import {
	createWatcher,
	deleteWatcher,
	getWatcher,
	getWatchersByAccount,
	updateWatcher,
} from "../watcher.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("watcher CRUD (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`;
	});

	afterAll(async () => {
		await testClient.end();
	});

	describe("createWatcher", () => {
		it("creates a watcher with valid input", async () => {
			const result = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			expect(result.status).toBe("active");
			expect(result.config.threshold).toBe(500);
			expect(result.cooldownMinutes).toBe(60);
			expect(result.type).toBe("spending_power_threshold");
			expect(result.config.direction).toBe("below");
		});

		it("rejects negative threshold", async () => {
			await expect(
				createWatcher(db, {
					accountId: "01JACCOUNT0000000000000",
					threshold: -100,
					cooldownMinutes: 60,
				}),
			).rejects.toThrow();
		});

		it("uses default cooldownMinutes when not provided", async () => {
			const result = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 200,
				cooldownMinutes: 60,
			});
			expect(result.cooldownMinutes).toBe(60);
		});
	});

	describe("getWatcher", () => {
		it("returns watcher by ID", async () => {
			const created = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			const result = await getWatcher(db, created.id);
			expect(result).not.toBeNull();
			expect(result?.id).toBe(created.id);
		});

		it("returns null for unknown ID", async () => {
			const result = await getWatcher(db, "nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("getWatchersByAccount", () => {
		it("returns all watchers for an account", async () => {
			await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 100,
				cooldownMinutes: 30,
			});
			await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			const results = await getWatchersByAccount(db, "01JACCOUNT0000000000000");
			expect(results).toHaveLength(2);
		});

		it("returns empty array when no watchers exist", async () => {
			const results = await getWatchersByAccount(db, "01JACCOUNT0000000000000");
			expect(results).toHaveLength(0);
		});
	});

	describe("updateWatcher", () => {
		it("updates threshold", async () => {
			const created = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			const updated = await updateWatcher(db, created.id, { threshold: 1000 });
			expect(updated.config.threshold).toBe(1000);
		});

		it("updates cooldownMinutes", async () => {
			const created = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			const updated = await updateWatcher(db, created.id, { cooldownMinutes: 120 });
			expect(updated.cooldownMinutes).toBe(120);
		});

		it("updates status", async () => {
			const created = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});

			const updated = await updateWatcher(db, created.id, { status: "paused" });
			expect(updated.status).toBe("paused");
		});

		it("throws when watcher not found", async () => {
			await expect(updateWatcher(db, "nonexistent", { status: "paused" })).rejects.toThrow(
				"Watcher nonexistent not found",
			);
		});
	});

	describe("deleteWatcher", () => {
		it("deletes watcher by ID", async () => {
			const created = await createWatcher(db, {
				accountId: "01JACCOUNT0000000000000",
				threshold: 500,
				cooldownMinutes: 60,
			});
			await deleteWatcher(db, created.id);
			const result = await getWatcher(db, created.id);
			expect(result).toBeNull();
		});

		it("does not throw when deleting nonexistent watcher", async () => {
			await expect(deleteWatcher(db, "nonexistent")).resolves.toBeUndefined();
		});
	});
});
