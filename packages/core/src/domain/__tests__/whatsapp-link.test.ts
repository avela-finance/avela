import { describe, expect, it } from "vitest";
import {
	createGetAccountByPhoneNumber,
	createGetWhatsAppLink,
	createLinkWhatsAppAccount,
	createUnlinkWhatsAppAccount,
	validatePhoneNumber,
} from "../whatsapp.js";

describe("validatePhoneNumber", () => {
	it("accepts valid E.164 numbers", () => {
		expect(validatePhoneNumber("+1234567890")).toBe(true);
		expect(validatePhoneNumber("+233201234567")).toBe(true);
	});

	it("rejects invalid numbers", () => {
		expect(validatePhoneNumber("1234567890")).toBe(false);
		expect(validatePhoneNumber("+")).toBe(false);
		expect(validatePhoneNumber("abc")).toBe(false);
		expect(validatePhoneNumber("")).toBe(false);
	});
});

describe("WhatsApp link factories", () => {
	it("exports all factory functions", () => {
		expect(createLinkWhatsAppAccount).toBeTypeOf("function");
		expect(createGetWhatsAppLink).toBeTypeOf("function");
		expect(createUnlinkWhatsAppAccount).toBeTypeOf("function");
		expect(createGetAccountByPhoneNumber).toBeTypeOf("function");
	});
});
