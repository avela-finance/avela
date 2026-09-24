import type { Account, MinimumBalance, PaymentStatus, PriceFloor } from "@avela/core";
import {
	calculateSpendingPower,
	createAccount,
	createDb,
	createDefaultPolicy,
	createGetAccountByPhoneNumber,
	createGetIdentityByAccount,
	createGetWhatsAppLink,
	createLinkWhatsAppAccount,
	createIsUsernameAvailable,
	createPaymentIntent,
	createRegisterUsername,
	createResolveUsername,
	createWatcher,
	deleteWatcher,
	evaluateAllActiveWatchers,
	evaluatePolicyRules,
	executePayment,
	getAccount,
	getAccountByWallet,
	getAgent,
	getAgentSpendingLog,
	getAgentsByAccount,
	getAsset,
	getDailySpending,
	getPaymentHistory,
	getPaymentIntent,
	getPolicy,
	getPortfolio,
	getReceipt,
	getWatcher,
	getWatchersByAccount,
	recordDeposit,
	recordSettlement,
	registerAgent,
	revokeAgent,
	updateAgentPermissions,
	updatePaymentStatus,
	updatePolicy,
	updateWatcher,
} from "@avela/core";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { encodeFunctionData } from "viem";
import { createAdapters } from "./adapters.js";
import { getEnv } from "./env.js";
import { handleButtonCallback } from "./integrations/whatsapp/callbacks.js";
import { createWhatsAppClient } from "./integrations/whatsapp/client.js";
import {
	formatHelpMessage,
	formatUnknownMessage,
	matchIntent,
} from "./integrations/whatsapp/messages.js";
import {
	formatBalanceMessage,
	formatSpendingPowerMessage,
} from "./integrations/whatsapp/notifications.js";
import { createWebhookRoutes } from "./integrations/whatsapp/webhook.js";
import { createAccountMiddleware } from "./middleware/account.js";
import { authMiddleware, getPrivyClient } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { createAccountRoutes } from "./routes/accounts.js";
import { agentsRoutes } from "./routes/agents.js";
import { createAssetRoutes } from "./routes/assets.js";
import { createHealthRoutes } from "./routes/health.js";
import { createIdentityRoutes } from "./routes/identity.js";
import { paymentsRoutes } from "./routes/payments.js";
import { policiesRoutes } from "./routes/policies.js";
import { createPortfolioRoutes } from "./routes/portfolio.js";
import { watchersRoutes } from "./routes/watchers.js";
import { createWhatsAppLinkRoutes } from "./routes/whatsapp.js";

export type AppVariables = {
	requestId: string;
	privyUserId: string;
	accountId?: string;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", requestId);

const env = getEnv();
const allowedOrigins = env.ALLOWED_ORIGINS?.split(",")
	.map((o) => o.trim())
	.filter(Boolean);
app.use(
	"*",
	cors(
		allowedOrigins && allowedOrigins.length > 0
			? { origin: allowedOrigins, credentials: true }
			: undefined,
	),
);
app.onError(errorHandler);

const db = createDb(env.DATABASE_URL);
const adapters = createAdapters(env);

type PrivyLinkedAccount = { type: string; chainType?: string; address?: string };

/**
 * First-login provisioning: map the Privy user to their embedded Ethereum
 * wallet, then look up or auto-create the Avela account (with default policy).
 * Note: Privy getUser is rate-limited — cache or move to lazy resolution
 * if per-request calls become a problem.
 */
async function resolvePrivyAccount(privyUserId: string): Promise<Account> {
	const user = await getPrivyClient().getUser(privyUserId);
	const wallet = (user.linkedAccounts as PrivyLinkedAccount[]).find(
		(a) => a.type === "wallet" && a.chainType === "ethereum" && a.address,
	);
	if (!wallet?.address) {
		throw new Error(`No Ethereum wallet linked to Privy user ${privyUserId}`);
	}
	const existing = await getAccountByWallet(db, wallet.address);
	if (existing) return existing;
	const account = await createAccount(db, wallet.address);
	await createDefaultPolicy(db, account.id);
	return account;
}

const accountMiddleware = createAccountMiddleware(resolvePrivyAccount);

// All account- and payment-scoped routes require auth + account context.
// (Asset prices and public identity resolution stay public — only /identity/me
// is gated, so /resolve and /available keep working for payment links.)
app.use("/accounts/*", authMiddleware, accountMiddleware);
app.use("/payments/*", authMiddleware, accountMiddleware);
app.use("/agents/*", authMiddleware, accountMiddleware);
app.use("/integrations/*", authMiddleware, accountMiddleware);
app.use("/identity/me", authMiddleware, accountMiddleware);

async function getAccountWalletAddress(accountId: string): Promise<string> {
	const account = await getAccount(db, accountId);
	if (!account) throw new Error(`Account not found: ${accountId}`);
	return account.walletAddress;
}

async function evaluatePolicyForPayment(params: { accountId: string; amount: number }) {
	const policy = await getPolicy(db, params.accountId);
	if (!policy || policy.enabled === false) {
		return { passed: true, requiresApproval: false, violations: [] as unknown[] };
	}
	const daily = await getDailySpending(db, params.accountId, policy);

	const positions = await getPortfolio(db, params.accountId);
	const currentPrices: Record<string, number> = {};
	const currentPositions: Record<string, bigint> = {};
	for (const position of positions) {
		const asset = getAsset(position.assetSymbol);
		if (!asset) continue;
		try {
			const price = await adapters.priceFeed.getPrice(asset.address, 196);
			currentPrices[position.assetSymbol] = price.price;
		} catch {
			// Skip assets with unavailable prices — floors just won't trigger for them.
		}
		currentPositions[position.assetSymbol] = BigInt(position.amount);
	}

	return evaluatePolicyRules({
		amount: params.amount,
		dailyLimit: policy.dailyLimit ? Number(policy.dailyLimit) : null,
		dailySpent: daily.total,
		approvalThreshold: policy.approvalThreshold ? Number(policy.approvalThreshold) : null,
		priceFloors: (policy.priceFloors as PriceFloor[] | null) ?? [],
		minimumBalances: (policy.minimumBalances as MinimumBalance[] | null) ?? [],
		currentPrices,
		currentPositions,
	});
}

const spendingPowerFor = (accountId: string) =>
	calculateSpendingPower(db, adapters.priceFeed, accountId);

// --- WhatsApp (optional — mounted only when verify token is configured) ---

const getAccountByPhone = createGetAccountByPhoneNumber(db);
const getWhatsAppLink = createGetWhatsAppLink(db);

function createWhatsAppSender() {
	if (!env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return null;
	const client = createWhatsAppClient({
		phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
		accessToken: env.WHATSAPP_API_TOKEN,
		verifyToken: env.WHATSAPP_VERIFY_TOKEN ?? "",
	});
	return {
		sendTextMessage: (to: string, body: string) => client.sendTextMessage(to, body),
	};
}

async function handleWhatsAppText(from: string, text: string): Promise<void> {
	const sender = createWhatsAppSender();
	if (!sender) return;

	const account = await getAccountByPhone(from);
	if (!account) {
		await sender.sendTextMessage(from, "No Avela account linked to this number.");
		return;
	}

	const intent = matchIntent(text);
	if (intent === "help") {
		await sender.sendTextMessage(from, formatHelpMessage());
		return;
	}
	if (intent === "unknown") {
		await sender.sendTextMessage(from, formatUnknownMessage());
		return;
	}
	if (intent === "spending_power") {
		const power = await spendingPowerFor(account.accountId);
		await sender.sendTextMessage(
			from,
			formatSpendingPowerMessage({
				perAsset: power.perAsset.map((a) => ({
					symbol: a.assetSymbol,
					value: a.positionValue,
					haircut: a.haircut,
					spendingPower: a.spendingPower,
				})),
				stablecoinBalance: power.stablecoinBalance,
				totalSpendingPower: power.totalSpendingPower,
			}),
		);
		return;
	}
	if (intent === "balance") {
		const power = await spendingPowerFor(account.accountId);
		const totalValue = power.perAsset.reduce((sum, a) => sum + a.positionValue, 0);
		await sender.sendTextMessage(
			from,
			formatBalanceMessage({
				totalValue,
				positions: power.perAsset.map((a) => ({
					symbol: a.assetSymbol,
					amount: a.spendingPower.toFixed(2),
					valueUsd: a.positionValue,
				})),
				totalSpendingPower: power.totalSpendingPower,
			}),
		);
		return;
	}
	// intent === "payments"
	const history = await getPaymentHistory(db, account.accountId, 5);
	const lines =
		history.length === 0
			? ["No recent payments."]
			: history.map((p) => `• $${Number(p.amount).toFixed(2)} — ${p.status}`);
	await sender.sendTextMessage(from, ["🧾 *Recent Payments*", ...lines].join("\n"));
}

async function handleWhatsAppButton(from: string, buttonId: string): Promise<void> {
	const sender = createWhatsAppSender();
	if (!sender) return;

	await handleButtonCallback(from, buttonId, {
		getAccountByPhoneNumber: getAccountByPhone,
		getPaymentIntent: (id) => getPaymentIntent(db, id),
		authorizePayment: async (paymentIntentId) => {
			await runExecutePayment(paymentIntentId);
		},
		rejectPayment: async (paymentIntentId) => {
			await updatePaymentStatus(db, paymentIntentId, "rejected");
		},
		sendTextMessage: sender.sendTextMessage,
	});
}

async function runExecutePayment(intentId: string) {
	return executePayment(
		{
			db,
			getPaymentIntent,
			updatePaymentStatus,
			evaluatePolicy: evaluatePolicyForPayment,
			calculateSpendingPower: spendingPowerFor,
			vaultAdapter: adapters.vaultAdapter,
			routerAdapter: adapters.routerAdapter,
			recordSettlement,
			getAccountWalletAddress,
		},
		intentId,
	);
}

// --- Routes ---

app.route(
	"/health",
	createHealthRoutes({
		checkDb: async () => {
			await db.execute(sql`SELECT 1`);
		},
	}),
);
const ERC20_APPROVE_ABI = [
	{
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "approve",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

const VAULT_DEPOSIT_ABI = [
	{
		inputs: [
			{ name: "token", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "deposit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

app.route(
	"/accounts",
	createAccountRoutes({
		createAccount: (walletAddress) => createAccount(db, walletAddress),
		getAccount: (id) => getAccount(db, id),
		getAccountByWallet: (walletAddress) => getAccountByWallet(db, walletAddress),
		prepareDeposit: async ({ accountId, assetSymbol, amountRaw }) => {
			const asset = getAsset(assetSymbol);
			if (!asset) throw new Error(`Unknown asset: ${assetSymbol}`);
			const amount = BigInt(amountRaw);
			const whitelisted = await adapters.vaultAdapter.isWhitelisted(asset.address);
			if (!whitelisted) throw new Error(`Asset not whitelisted in vault: ${assetSymbol}`);
			return {
				accountId,
				assetSymbol,
				token: asset.address,
				vault: env.AVELA_VAULT_ADDRESS,
				amountRaw,
				amountDecimals: asset.decimals,
				whitelisted,
				approve: {
					to: asset.address,
					data: encodeFunctionData({
						abi: ERC20_APPROVE_ABI,
						functionName: "approve",
						args: [env.AVELA_VAULT_ADDRESS as `0x${string}`, amount],
					}),
				},
				deposit: {
					to: env.AVELA_VAULT_ADDRESS,
					data: encodeFunctionData({
						abi: VAULT_DEPOSIT_ABI,
						functionName: "deposit",
						args: [asset.address as `0x${string}`, amount],
					}),
				},
			};
		},
		confirmDeposit: ({ accountId, assetSymbol, amountRaw, txHash }) =>
			recordDeposit(db, {
				accountId,
				assetSymbol,
				amount: BigInt(amountRaw),
				depositTxHash: txHash,
			}),
	}),
);
app.route(
	"/assets",
	createAssetRoutes({
		getPrice: (asset) => adapters.priceFeed.getPrice(asset.address, 196),
	}),
);
app.route(
	"/accounts/:id/portfolio",
	createPortfolioRoutes({
		getPortfolio: (accountId) => getPortfolio(db, accountId),
		calculateSpendingPower: spendingPowerFor,
	}),
);

app.route(
	"/identity",
	createIdentityRoutes({
		getIdentityByAccount: createGetIdentityByAccount(db),
		registerUsername: createRegisterUsername(db),
		resolveUsername: createResolveUsername(db),
		isUsernameAvailable: createIsUsernameAvailable(db),
	}),
);

const linkWhatsAppAccount = createLinkWhatsAppAccount(db);
app.route(
	"/integrations/whatsapp",
	createWhatsAppLinkRoutes({
		linkAccount: (accountId, phoneNumber) =>
			linkWhatsAppAccount(accountId, phoneNumber, phoneNumber),
	}),
);

app.route(
	"/payments",
	paymentsRoutes({
		createPaymentIntent: (params) =>
			createPaymentIntent(db, {
				accountId: params.accountId,
				amount: params.amount,
				recipientAddress: params.recipientAddress,
				recipientUsername: params.recipientUsername,
			}),
		getPaymentIntent: (id) => getPaymentIntent(db, id),
		getPaymentHistory: (accountId, limit) => getPaymentHistory(db, accountId, limit),
		executePayment: runExecutePayment,
		getReceipt: (paymentIntentId) => getReceipt(db, paymentIntentId),
		updatePaymentStatus: (id, status) => updatePaymentStatus(db, id, status as PaymentStatus),
	}),
);

app.route(
	"/agents",
	agentsRoutes({
		registerAgent: (params) => registerAgent(db, params),
		getAgent: (agentId) => getAgent(db, agentId),
		getAgentsByAccount: (accountId: string) => getAgentsByAccount(db, accountId),
		updateAgentPermissions: (agentId, permissions) =>
			updateAgentPermissions(db, agentId, permissions),
		revokeAgent: (agentId) => revokeAgent(db, agentId),
		getAgentSpendingLog: (agentId, limit) => getAgentSpendingLog(db, agentId, limit),
	}),
);

app.route(
	"/accounts/:accountId/watchers",
	watchersRoutes({
		createWatcher: (params) => createWatcher(db, params),
		getWatchersByAccount: (accountId) => getWatchersByAccount(db, accountId),
		getWatcher: (watcherId) => getWatcher(db, watcherId),
		updateWatcher: (watcherId, updates) => updateWatcher(db, watcherId, updates),
		deleteWatcher: (watcherId) => deleteWatcher(db, watcherId),
		evaluateAllActiveWatchers: () =>
			evaluateAllActiveWatchers(
				db,
				async (_db, accountId) => {
					const power = await spendingPowerFor(accountId);
					return { totalSpendingPower: power.totalSpendingPower };
				},
				async (accountId, message) => {
					const sender = createWhatsAppSender();
					const link = await getWhatsAppLink(accountId).catch(() => null);
					if (sender && link) {
						await sender.sendTextMessage(link.phoneNumber, message);
						return;
					}
					console.log(`[watcher-alert] account=${accountId} ${message}`);
				},
			),
	}),
);

app.route(
	"/accounts/:accountId/policies",
	policiesRoutes({
		getPolicy: (accountId) => getPolicy(db, accountId),
		updatePolicy: (accountId, updates) =>
			updatePolicy(db, accountId, updates as Parameters<typeof updatePolicy>[2]),
		getDailySpending: (accountId, policy) =>
			getDailySpending(db, accountId, policy as { dailyLimit: string | null }),
	}),
);

if (env.WHATSAPP_VERIFY_TOKEN) {
	app.route(
		"/webhooks/whatsapp",
		createWebhookRoutes({
			verifyToken: env.WHATSAPP_VERIFY_TOKEN,
			onTextMessage: handleWhatsAppText,
			onButtonReply: handleWhatsAppButton,
		}),
	);
} else {
	console.warn("[avela] WHATSAPP_VERIFY_TOKEN unset — WhatsApp webhook disabled");
}

export default app;
export type AppType = typeof app;
