import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { accountsTable, identitiesTable } from "../db/schema.js";
import type { Identity } from "./types.js";

export const USERNAME_RULES = {
	minLength: 3,
	maxLength: 32,
	pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
	singleCharPattern: /^[a-z0-9]$/,
	reserved: ["admin", "avela", "pay", "api", "app", "www", "help", "support"],
} as const;

export function validateUsername(username: string): { valid: boolean; error?: string } {
	if (!username || username.length < USERNAME_RULES.minLength) {
		return {
			valid: false,
			error: `Username must be at least ${USERNAME_RULES.minLength} characters.`,
		};
	}

	if (username.length > USERNAME_RULES.maxLength) {
		return {
			valid: false,
			error: `Username must be at most ${USERNAME_RULES.maxLength} characters.`,
		};
	}

	if (username !== username.toLowerCase()) {
		return { valid: false, error: "Username must be lowercase." };
	}

	const validPattern =
		username.length === 1
			? USERNAME_RULES.singleCharPattern.test(username)
			: USERNAME_RULES.pattern.test(username);

	if (!validPattern) {
		return {
			valid: false,
			error:
				"Username must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens.",
		};
	}

	if ((USERNAME_RULES.reserved as readonly string[]).includes(username)) {
		return { valid: false, error: `"${username}" is reserved.` };
	}

	return { valid: true };
}

export function createRegisterUsername(db: Database) {
	return async function registerUsername(
		accountId: string,
		username: string,
		displayName?: string,
	): Promise<Identity> {
		const validation = validateUsername(username);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const now = new Date();
		const [identity] = await db
			.insert(identitiesTable)
			.values({
				id: ulid(),
				accountId,
				username,
				displayName: displayName ?? null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return identity!;
	};
}

export function createResolveUsername(db: Database) {
	return async function resolveUsername(
		username: string,
	): Promise<{ accountId: string; walletAddress: string } | null> {
		const [identity] = await db
			.select()
			.from(identitiesTable)
			.where(eq(identitiesTable.username, username.toLowerCase()));

		if (!identity) return null;

		const [account] = await db
			.select({ id: accountsTable.id, walletAddress: accountsTable.walletAddress })
			.from(accountsTable)
			.where(eq(accountsTable.id, identity.accountId));

		if (!account) return null;

		return { accountId: account.id, walletAddress: account.walletAddress };
	};
}

export function createIsUsernameAvailable(db: Database) {
	return async function isUsernameAvailable(username: string): Promise<boolean> {
		const validation = validateUsername(username.toLowerCase());
		if (!validation.valid) return false;

		const [existing] = await db
			.select()
			.from(identitiesTable)
			.where(eq(identitiesTable.username, username.toLowerCase()));

		return !existing;
	};
}
