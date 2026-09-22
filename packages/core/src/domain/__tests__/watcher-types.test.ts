import { describe, it, expect } from "vitest";
import {
	WatcherSchema,
	SpendingPowerThresholdConfigSchema,
	WatcherEvaluationSchema,
	CreateWatcherInputSchema,
} from "../types.js";

describe("Watcher types", () => {
	it("validates a well-formed SpendingPowerThresholdConfig", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: 500,
			direction: "below",
		});
		expect(result.success).toBe(true);
	});

	it("rejects negative threshold", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: -100,
			direction: "below",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid direction", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: 500,
			direction: "above",
		});
		expect(result.success).toBe(false);
	});

	it("validates a well-formed Watcher", () => {
		const watcher = {
			id: "01JWATCH0000000000000001",
			accountId: "01JACCOUNT000000000000001",
			type: "spending_power_threshold" as const,
			config: { threshold: 500, direction: "below" as const },
			status: "active" as const,
			lastEvaluatedAt: null,
			lastTriggeredAt: null,
			cooldownMinutes: 60,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const result = WatcherSchema.safeParse(watcher);
		expect(result.success).toBe(true);
	});

	it("validates a well-formed WatcherEvaluation", () => {
		const evaluation = {
			watcherId: "01JWATCH0000000000000001",
			currentValue: 480,
			threshold: 500,
			triggered: true,
			evaluatedAt: new Date(),
		};
		const result = WatcherEvaluationSchema.safeParse(evaluation);
		expect(result.success).toBe(true);
	});

	it("validates CreateWatcherInput", () => {
		const result = CreateWatcherInputSchema.safeParse({
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		expect(result.success).toBe(true);
	});

	it("defaults cooldownMinutes to 60 when omitted", () => {
		const result = CreateWatcherInputSchema.safeParse({
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cooldownMinutes).toBe(60);
		}
	});
});
