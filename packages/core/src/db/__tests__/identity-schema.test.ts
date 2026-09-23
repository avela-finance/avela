import { describe, expect, it } from "vitest";
import { identitiesTable } from "../schema.js";

describe("identities schema", () => {
	it("exports identitiesTable", () => {
		expect(identitiesTable).toBeDefined();
	});

	it("has required columns", () => {
		const columns = identitiesTable;
		expect(columns.id).toBeDefined();
		expect(columns.accountId).toBeDefined();
		expect(columns.username).toBeDefined();
		expect(columns.displayName).toBeDefined();
		expect(columns.createdAt).toBeDefined();
		expect(columns.updatedAt).toBeDefined();
	});
});
