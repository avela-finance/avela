import { describe, expect, it } from "vitest";
import type { VaultAdapter } from "../vault-adapter.js";

describe("VaultAdapter interface", () => {
	it("getLockedBalance returns expected shape", async () => {
		const testAdapter: VaultAdapter = {
			getLockedBalance: async () => 1000000000000000000n,
		};

		const balance = await testAdapter.getLockedBalance(
			"0x1234567890abcdef1234567890abcdef12345678",
			"0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
		);

		expect(balance).toBe(1000000000000000000n);
	});
});
