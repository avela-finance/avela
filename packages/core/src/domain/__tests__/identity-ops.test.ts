import { describe, it, expect } from "vitest";
import {
	createRegisterUsername,
	createResolveUsername,
	createIsUsernameAvailable,
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
