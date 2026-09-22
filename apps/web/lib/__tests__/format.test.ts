import { describe, expect, it } from "vitest";
import { formatAddress, formatCurrency, formatDate } from "../format";

describe("formatCurrency", () => {
	it("formats a number with two decimal places", () => {
		expect(formatCurrency(1234.5)).toBe("$1,234.50");
	});

	it("formats zero", () => {
		expect(formatCurrency(0)).toBe("$0.00");
	});
});

describe("formatAddress", () => {
	it("truncates a long address", () => {
		expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
	});

	it("returns short addresses unchanged", () => {
		expect(formatAddress("0x1234")).toBe("0x1234");
	});
});

describe("formatDate", () => {
	it("includes the year", () => {
		expect(formatDate("2026-09-21T14:30:00Z")).toContain("2026");
	});
});
