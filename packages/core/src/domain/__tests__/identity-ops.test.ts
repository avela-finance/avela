import { describe, expect, it } from "vitest";
import {
	createIsUsernameAvailable,
	createRegisterUsername,
	createResolveUsername,
} from "../identity.js";

describe("identity operation factories", () => {
	it("exports createRegisterUsername", () => {
		expect(createRegisterUsername).toBeTypeOf("function");
	});

	it("exports createResolveUsername", () => {
		expect(createResolveUsername).toBeTypeOf("function");
	});

	it("exports createIsUsernameAvailable", () => {
		expect(createIsUsernameAvailable).toBeTypeOf("function");
	});
});

describe("registerUsername behavior", () => {
	it("throws on invalid username — validation runs before DB access", async () => {
		// null cast is safe: validation throws before any DB call
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const register = createRegisterUsername(null as any);
		await expect(register("account-1", "ab")).rejects.toThrow(
			"Username must be at least 3 characters.",
		);
	});

	it("throws on reserved username", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const register = createRegisterUsername(null as any);
		await expect(register("account-1", "admin")).rejects.toThrow('"admin" is reserved.');
	});

	it("throws on username with uppercase letters", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const register = createRegisterUsername(null as any);
		await expect(register("account-1", "MyUser")).rejects.toThrow("Username must be lowercase.");
	});
});

describe("isUsernameAvailable behavior", () => {
	it("returns false for invalid username — no DB needed", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const isAvailable = createIsUsernameAvailable(null as any);
		const result = await isAvailable("ab");
		expect(result).toBe(false);
	});

	it("returns false for reserved username", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const isAvailable = createIsUsernameAvailable(null as any);
		const result = await isAvailable("admin");
		expect(result).toBe(false);
	});
});
