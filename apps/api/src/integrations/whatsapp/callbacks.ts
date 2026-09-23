export type CallbackAction = {
	action: "approve" | "reject";
	paymentIntentId: string;
};

export function parseCallbackAction(callbackData: string): CallbackAction | null {
	const parts = callbackData.split(":");
	if (parts.length !== 2) return null;

	const [action, paymentIntentId] = parts;
	if (!action || !paymentIntentId) return null;

	if (action !== "approve" && action !== "reject") return null;

	return { action, paymentIntentId };
}

export type CallbackDeps = {
	getAccountByPhoneNumber: (phone: string) => Promise<{ accountId: string } | null>;
	getPaymentIntent: (id: string) => Promise<{ accountId: string } | null>;
	authorizePayment: (paymentIntentId: string) => Promise<void>;
	rejectPayment: (paymentIntentId: string) => Promise<void>;
	sendTextMessage: (to: string, body: string) => Promise<void>;
};

export async function handleButtonCallback(
	from: string,
	buttonId: string,
	deps: CallbackDeps,
): Promise<void> {
	const parsed = parseCallbackAction(buttonId);
	if (!parsed) {
		await deps.sendTextMessage(from, "Invalid action. Please try again.");
		return;
	}

	const account = await deps.getAccountByPhoneNumber(from);
	if (!account) {
		await deps.sendTextMessage(from, "No Avela account linked to this number.");
		return;
	}

	const intent = await deps.getPaymentIntent(parsed.paymentIntentId);
	if (!intent || intent.accountId !== account.accountId) {
		await deps.sendTextMessage(from, "Payment not found or not authorized.");
		return;
	}

	try {
		if (parsed.action === "approve") {
			await deps.authorizePayment(parsed.paymentIntentId);
			await deps.sendTextMessage(from, "✅ Payment approved and executing.");
		} else {
			await deps.rejectPayment(parsed.paymentIntentId);
			await deps.sendTextMessage(from, "❌ Payment rejected.");
		}
	} catch {
		await deps.sendTextMessage(
			from,
			"Something went wrong. Please try again or visit app.useavela.xyz",
		);
	}
}
