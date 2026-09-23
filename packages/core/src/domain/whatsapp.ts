import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulidx";
import { whatsappLinksTable } from "../db/schema.js";
import type { WhatsAppLink } from "./types.js";

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function validatePhoneNumber(phone: string): boolean {
	return E164_REGEX.test(phone);
}

export function createLinkWhatsAppAccount(db: PostgresJsDatabase) {
	return async function linkWhatsAppAccount(
		accountId: string,
		phoneNumber: string,
		waId: string,
	): Promise<WhatsAppLink> {
		if (!validatePhoneNumber(phoneNumber)) {
			throw new Error("Invalid phone number format. Must be E.164 (e.g. +1234567890).");
		}

		const [existing] = await db
			.select()
			.from(whatsappLinksTable)
			.where(eq(whatsappLinksTable.phoneNumber, phoneNumber));

		if (existing && existing.accountId !== accountId) {
			throw new Error("Phone number is already linked to another account.");
		}

		const [link] = await db
			.insert(whatsappLinksTable)
			.values({
				id: ulid(),
				accountId,
				phoneNumber,
				waId,
				linkedAt: new Date(),
				active: true,
			})
			.onConflictDoUpdate({
				target: whatsappLinksTable.phoneNumber,
				set: {
					waId,
					linkedAt: new Date(),
					active: true,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!link) throw new Error("Insert did not return a row");
		return link;
	};
}

export function createGetWhatsAppLink(db: PostgresJsDatabase) {
	return async function getWhatsAppLink(accountId: string): Promise<WhatsAppLink | null> {
		const [link] = await db
			.select()
			.from(whatsappLinksTable)
			.where(and(eq(whatsappLinksTable.accountId, accountId), eq(whatsappLinksTable.active, true)));

		return link ?? null;
	};
}

export function createUnlinkWhatsAppAccount(db: PostgresJsDatabase) {
	return async function unlinkWhatsAppAccount(accountId: string): Promise<void> {
		await db
			.update(whatsappLinksTable)
			.set({ active: false, updatedAt: new Date() })
			.where(eq(whatsappLinksTable.accountId, accountId))
			.returning();
	};
}

export function createGetAccountByPhoneNumber(db: PostgresJsDatabase) {
	return async function getAccountByPhoneNumber(
		phoneNumber: string,
	): Promise<{ accountId: string } | null> {
		const [link] = await db
			.select()
			.from(whatsappLinksTable)
			.where(eq(whatsappLinksTable.phoneNumber, phoneNumber));

		if (!link?.active) return null;
		return { accountId: link.accountId };
	};
}
