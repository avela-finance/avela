export const USERNAME_RULES = {
	minLength: 3,
	maxLength: 32,
	pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
	singleCharPattern: /^[a-z0-9]$/,
	reserved: [
		"admin",
		"avela",
		"pay",
		"api",
		"app",
		"www",
		"help",
		"support",
	],
} as const;

export function validateUsername(
	username: string,
): { valid: boolean; error?: string } {
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

	if (USERNAME_RULES.reserved.includes(username)) {
		return { valid: false, error: `"${username}" is reserved.` };
	}

	return { valid: true };
}
