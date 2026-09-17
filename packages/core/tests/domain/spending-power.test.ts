// packages/core/tests/domain/spending-power.test.ts
import { describe, expect, it } from "vitest";
import { calculateSpendingPower } from "../../src/domain/spending-power.js";

describe("calculateSpendingPower", () => {
	it("returns balance minus locked minus reserve", () => {
		expect(calculateSpendingPower("1000", "200", "100")).toBe("700");
	});

	it("returns 0 when balance equals locked plus reserve", () => {
		expect(calculateSpendingPower("300", "200", "100")).toBe("0");
	});

	it("returns 0 when balance is less than locked plus reserve", () => {
		expect(calculateSpendingPower("100", "200", "100")).toBe("0");
	});

	it("returns full balance minus locked when reserve is 0", () => {
		expect(calculateSpendingPower("1000", "200", "0")).toBe("800");
	});

	it("returns 0 when balance is 0", () => {
		expect(calculateSpendingPower("0", "0", "0")).toBe("0");
	});

	it("handles decimal amounts", () => {
		expect(calculateSpendingPower("100.50", "20.25", "10.00")).toBe("70.25");
	});

	it("returns 0 when fully locked", () => {
		expect(calculateSpendingPower("500", "500", "0")).toBe("0");
	});
});
