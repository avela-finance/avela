export type MessageIntent = "balance" | "spending_power" | "payments" | "help" | "unknown";

const INTENT_PATTERNS: Array<{ intent: MessageIntent; patterns: RegExp[] }> = [
	{
		intent: "spending_power",
		patterns: [/\bspending\b/i, /\bspend\b/i, /\bpower\b/i],
	},
	{
		intent: "balance",
		patterns: [/\bbalance\b/i, /\bhow much\b/i, /\bportfolio\b/i],
	},
	{
		intent: "payments",
		patterns: [/\bpayments?\b/i, /\bhistory\b/i, /\btransactions?\b/i],
	},
	{
		intent: "help",
		patterns: [/\bhelp\b/i, /\bcommands?\b/i, /\bstart\b/i],
	},
];

export function matchIntent(text: string): MessageIntent {
	for (const { intent, patterns } of INTENT_PATTERNS) {
		for (const pattern of patterns) {
			if (pattern.test(text)) {
				return intent;
			}
		}
	}
	return "unknown";
}

export function formatHelpMessage(): string {
	return [
		"I can help with:",
		"• *balance* — view your portfolio",
		"• *spending* — check spending power",
		"• *payments* — recent payment history",
		"",
		"Or visit app.avela.xyz",
	].join("\n");
}

export function formatUnknownMessage(): string {
	return "I didn't understand that. Try *balance*, *spending*, or *payments*. Or visit app.avela.xyz";
}
