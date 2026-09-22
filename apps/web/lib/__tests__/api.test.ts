import { describe, expect, it } from "vitest";
import { buildUrl, formatApiError } from "../api";

describe("buildUrl", () => {
	it("joins base URL and path", () => {
		const url = buildUrl("/accounts/123", "http://localhost:8787");
		expect(url).toBe("http://localhost:8787/accounts/123");
	});

	it("appends query params", () => {
		const url = buildUrl("/payments", "http://localhost:8787", {
			limit: "10",
			status: "settled",
		});
		expect(url).toBe("http://localhost:8787/payments?limit=10&status=settled");
	});

	it("omits undefined query params", () => {
		const url = buildUrl("/payments", "http://localhost:8787", {
			limit: "10",
			status: undefined,
		});
		expect(url).toBe("http://localhost:8787/payments?limit=10");
	});
});

describe("formatApiError", () => {
	it("extracts error message from API error response", () => {
		const error = formatApiError({
			error: { code: "NOT_FOUND", message: "Account not found" },
		});
		expect(error).toBe("Account not found");
	});

	it("returns fallback for unknown shape", () => {
		const error = formatApiError({ unexpected: true });
		expect(error).toBe("An unexpected error occurred");
	});
});
