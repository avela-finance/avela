import { describe, expect, it } from "vitest";
import { getProduct } from "../../../lib/demo-products.js";

describe("checkout flow data", () => {
	it("calculates cart total correctly for multiple products", () => {
		const cart = ["1", "2", "3"];
		const total = cart.reduce((sum, id) => {
			const product = getProduct(id);
			return sum + (product?.price ?? 0);
		}, 0);
		expect(total).toBe(85);
	});

	it("handles empty cart", () => {
		const cart: string[] = [];
		const total = cart.reduce((sum, id) => {
			const product = getProduct(id);
			return sum + (product?.price ?? 0);
		}, 0);
		expect(total).toBe(0);
	});

	it("generates correct URL params for cart", () => {
		const cart = ["1", "3"];
		const params = cart.join(",");
		expect(params).toBe("1,3");
	});

	it("parses URL params back to products", () => {
		const params = "1,2";
		const ids = params.split(",");
		const products = ids.map(getProduct).filter(Boolean);
		expect(products).toHaveLength(2);
		expect(products[0]?.name).toBe("API Credits");
		expect(products[1]?.name).toBe("Cloud Compute");
	});
});
