import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS, getProduct } from "../demo-products.js";

describe("demo products", () => {
	it("has exactly 3 products", () => {
		expect(DEMO_PRODUCTS).toHaveLength(3);
	});

	it("each product has required fields", () => {
		for (const product of DEMO_PRODUCTS) {
			expect(product.id).toBeTruthy();
			expect(product.name).toBeTruthy();
			expect(product.description).toBeTruthy();
			expect(product.price).toBeGreaterThan(0);
			expect(product.image).toBeTruthy();
		}
	});

	it("products have correct prices", () => {
		const prices = DEMO_PRODUCTS.map((p) => p.price).sort((a, b) => a - b);
		expect(prices).toEqual([10, 25, 50]);
	});

	it("getProduct returns product by id", () => {
		const product = getProduct("1");
		expect(product).toBeDefined();
		expect(product?.name).toBe("API Credits");
	});

	it("getProduct returns undefined for unknown id", () => {
		expect(getProduct("999")).toBeUndefined();
	});
});
