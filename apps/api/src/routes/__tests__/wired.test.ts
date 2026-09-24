import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { authMiddleware } from "../../middleware/auth.js";
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
	it("requires auth (401 without token) when mounted behind authMiddleware", async () => {
		const createAccount = vi.fn();
		const app = new Hono();
		app.use("/accounts/*", authMiddleware);
		app.route(
			"/accounts",
			createAccountRoutes({
				createAccount,
				getAccount: vi.fn(),
				getAccountByWallet: vi.fn().mockResolvedValue(null),
				prepareDeposit: vi.fn(),
				confirmDeposit: vi.fn(),
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

	it("returns a deposit plan with approve + deposit calldata", async () => {
		const plan = {
			accountId: "01JACCOUNT000000000000001",
			assetSymbol: "wSPYx",
			token: "0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
			vault: "0x3479183bcbcC3643fDb6a26C7215e602095C2086",
			amountRaw: "1000000000000000000",
			amountDecimals: 18,
			whitelisted: true,
			approve: { to: "0xtoken", data: "0x095ea7b3" },
			deposit: { to: "0xvault", data: "0xb6b55f25" },
		};
		const prepareDeposit = vi.fn().mockResolvedValue(plan);
		const app = new Hono();
		app.route(
			"/accounts",
			createAccountRoutes({
				createAccount: vi.fn(),
				getAccount: vi.fn(),
				getAccountByWallet: vi.fn(),
				prepareDeposit,
				confirmDeposit: vi.fn(),
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/deposit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ assetSymbol: "wSPYx", amountRaw: "1000000000000000000" }),
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof plan };
		expect(body.data.approve.data).toBe("0x095ea7b3");
		expect(body.data.deposit.data).toBe("0xb6b55f25");
		expect(prepareDeposit).toHaveBeenCalledWith({
			accountId: "01JACCOUNT000000000000001",
			assetSymbol: "wSPYx",
			amountRaw: "1000000000000000000",
		});
	});

	it("rejects invalid deposit amounts with 400", async () => {
		const prepareDeposit = vi.fn();
		const app = new Hono();
		app.route(
			"/accounts",
			createAccountRoutes({
				createAccount: vi.fn(),
				getAccount: vi.fn(),
				getAccountByWallet: vi.fn(),
				prepareDeposit,
				confirmDeposit: vi.fn(),
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/deposit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ assetSymbol: "wSPYx", amountRaw: "0" }),
		});
		expect(res.status).toBe(400);
		expect(prepareDeposit).not.toHaveBeenCalled();
	});

	it("confirms a deposit and returns the position", async () => {
		const position = {
			id: "01JPOS000000000000000001",
			accountId: "01JACCOUNT000000000000001",
			assetSymbol: "wSPYx",
			amount: 1000000000000000000n,
			depositTxHash: `0x${"ab".repeat(32)}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const confirmDeposit = vi.fn().mockResolvedValue(position);
		const app = new Hono();
		app.route(
			"/accounts",
			createAccountRoutes({
				createAccount: vi.fn(),
				getAccount: vi.fn(),
				getAccountByWallet: vi.fn(),
				prepareDeposit: vi.fn(),
				confirmDeposit,
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/deposit/confirm", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				assetSymbol: "wSPYx",
				amountRaw: "1000000000000000000",
				txHash: `0x${"ab".repeat(32)}`,
			}),
		});
		expect(res.status).toBe(201);
		const body = (await res.json()) as { data: { amount: string } };
		expect(body.data.amount).toBe("1000000000000000000");
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
		app.use("/accounts/*", authMiddleware);
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
