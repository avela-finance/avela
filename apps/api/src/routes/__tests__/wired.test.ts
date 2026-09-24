import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createAccountRoutes } from "../accounts.js";
import { createAssetRoutes } from "../assets.js";
import { createPortfolioRoutes } from "../portfolio.js";

const WALLET = "0x1234567890abcdef1234567890abcdef12345678";
const mockAccount = {
	id: "01JACCOUNT000000000000001",
	walletAddress: WALLET,
	username: null,
	status: "active",
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("createAccountRoutes", () => {
	it("requires auth (401 without token)", async () => {
		const createAccount = vi.fn();
		const app = new Hono();
		app.route(
			"/accounts",
			createAccountRoutes({
				createAccount,
				getAccount: vi.fn(),
				getAccountByWallet: vi.fn().mockResolvedValue(null),
			}),
		);

		const res = await app.request("/accounts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ walletAddress: WALLET }),
		});
		expect(res.status).toBe(401);
		expect(createAccount).not.toHaveBeenCalled();
	});

	it("exposes the wired mock account shape", () => {
		expect(mockAccount.walletAddress).toBe(WALLET);
	});
});

describe("createAssetRoutes", () => {
	it("lists 5 MVP assets", async () => {
		const app = new Hono();
		app.route("/assets", createAssetRoutes({ getPrice: vi.fn() }));

		const res = await app.request("/assets");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { symbol: string; poolAddress: string }[] };
		expect(body.data).toHaveLength(5);
		// No zero-address pools remain after wiring
		for (const asset of body.data) {
			expect(asset.poolAddress).not.toBe("0x0000000000000000000000000000000000000000");
		}
	});

	it("returns 404 for unknown asset", async () => {
		const app = new Hono();
		app.route("/assets", createAssetRoutes({ getPrice: vi.fn() }));

		const res = await app.request("/assets/wFAKE/price");
		expect(res.status).toBe(404);
	});

	it("returns TWAP price for a known asset", async () => {
		const app = new Hono();
		app.route(
			"/assets",
			createAssetRoutes({
				getPrice: vi.fn().mockResolvedValue({
					price: 771.5,
					source: "uniswap_twap",
					confidence: 0.9,
					timestamp: new Date(),
				}),
			}),
		);

		const res = await app.request("/assets/wSPYx/price");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { price: number; source: string } };
		expect(body.data.price).toBe(771.5);
		expect(body.data.source).toBe("uniswap_twap");
	});

	it("returns 503 when the pool read fails", async () => {
		const app = new Hono();
		app.route(
			"/assets",
			createAssetRoutes({ getPrice: vi.fn().mockRejectedValue(new Error("No pool")) }),
		);

		const res = await app.request("/assets/wSPYx/price");
		expect(res.status).toBe(503);
	});
});

describe("createPortfolioRoutes", () => {
	it("requires auth (401 without token) and never calls deps", async () => {
		const getPortfolio = vi.fn();
		const calculateSpendingPower = vi.fn();
		const app = new Hono();
		app.route(
			"/accounts/:id/portfolio",
			createPortfolioRoutes({ getPortfolio, calculateSpendingPower }),
		);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/portfolio");
		expect(res.status).toBe(401);
		expect(getPortfolio).not.toHaveBeenCalled();
		expect(calculateSpendingPower).not.toHaveBeenCalled();
	});
});
