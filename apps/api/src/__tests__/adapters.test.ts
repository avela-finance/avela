import { describe, expect, it } from "vitest";
import { createAdapters } from "../adapters.js";
import type { Env } from "../env.js";

const TEST_ENV: Env = {
	DATABASE_URL: "postgresql://localhost:5432/avela",
	SUPABASE_URL: "https://example.supabase.co",
	SUPABASE_ANON_KEY: "test-key",
	PRIVY_APP_ID: "test-app-id",
	PRIVY_APP_SECRET: "test-app-secret",
	XLAYER_RPC_URL: "https://rpc.xlayer.tech",
	PORT: 3001,
	AVELA_VAULT_ADDRESS: "0x3479183bcbcC3643fDb6a26C7215e602095C2086",
	AVELA_ROUTER_ADDRESS: "0x6986CF2784f112bc1610ee743F33246d9C4B869B",
	SIGNER_PRIVATE_KEY: "0x0000000000000000000000000000000000000000000000000000000000000001",
};

describe("createAdapters", () => {
	it("builds db, vault, router, and price feed adapters without network calls", () => {
		const adapters = createAdapters(TEST_ENV);

		expect(adapters.db).toBeDefined();
		expect(adapters.vaultAdapter.getLockedBalance).toBeTypeOf("function");
		expect(adapters.routerAdapter.executePayment).toBeTypeOf("function");
		expect(adapters.routerAdapter.isPaymentExecuted).toBeTypeOf("function");
		expect(adapters.priceFeed.getPrice).toBeTypeOf("function");
	});

	it("rejects pool lookups for unregistered assets (zero-address guard)", async () => {
		const adapters = createAdapters(TEST_ENV);

		await expect(
			adapters.priceFeed.getPrice("0x0000000000000000000000000000000000000000", 196),
		).rejects.toThrow("No pool configured");
	});
});
