import { describe, expect, it, vi } from "vitest";
import { AccountService } from "../../src/services/account.service.js";

describe("AccountService", () => {
	const mockDb = {
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue([]),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
	} as any;

	it("creates an account with valid input", async () => {
		const service = new AccountService(mockDb);
		const result = await service.create({
			externalUserId: "privy-123",
			name: "Test Business",
			type: "business",
			walletAddress: "0xabc123",
		});
		expect(result).toBeDefined();
		expect(result).toHaveProperty("id");
	});

	it("rejects invalid input", async () => {
		const service = new AccountService(mockDb);
		await expect(
			service.create({ externalUserId: "", name: "", type: "business", walletAddress: "" }),
		).rejects.toThrow();
	});
});
