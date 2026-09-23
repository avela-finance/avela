import { describe, expect, it } from "vitest";
import { USERNAME_RULES, validateUsername } from "../identity.js";

describe("validateUsername", () => {
	it("accepts valid usernames", () => {
		expect(validateUsername("samuel").valid).toBe(true);
		expect(validateUsername("my-name").valid).toBe(true);
		expect(validateUsername("abc").valid).toBe(true);
		expect(validateUsername("user123").valid).toBe(true);
		expect(validateUsername("a-b-c-d").valid).toBe(true);
	});

	it("rejects too short", () => {
		const result = validateUsername("ab");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("at least 3");
	});

	it("rejects too long", () => {
		const result = validateUsername("a".repeat(33));
		expect(result.valid).toBe(false);
		expect(result.error).toContain("at most 32");
	});

	it("rejects starting with hyphen", () => {
		const result = validateUsername("-username");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("start and end");
	});

	it("rejects ending with hyphen", () => {
		const result = validateUsername("username-");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("start and end");
	});

	it("rejects uppercase (converts to lowercase for check)", () => {
		const result = validateUsername("UserName");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("lowercase");
	});

	it("rejects special characters", () => {
		expect(validateUsername("user_name").valid).toBe(false);
		expect(validateUsername("user.name").valid).toBe(false);
		expect(validateUsername("user@name").valid).toBe(false);
		expect(validateUsername("user name").valid).toBe(false);
	});

	it("rejects reserved words", () => {
		const result = validateUsername("admin");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("reserved");
	});

	it("rejects all reserved words", () => {
		for (const word of USERNAME_RULES.reserved) {
			expect(validateUsername(word).valid).toBe(false);
		}
	});

	it("rejects empty string", () => {
		expect(validateUsername("").valid).toBe(false);
	});
});
