import type { PublicClient, WalletClient } from "viem";

export type ExecutePaymentParams = {
	token: string;
	merchant: string;
	amount: bigint;
	paymentId: string;
	collateralOwner: string;
};

export type ExecutePaymentResult = {
	txHash: string;
	blockNumber: number;
	gasUsed: bigint;
};

export interface RouterAdapter {
	executePayment(params: ExecutePaymentParams): Promise<ExecutePaymentResult>;
	isPaymentExecuted(paymentId: string): Promise<boolean>;
}

const ROUTER_ABI = [
	{
		inputs: [
			{ name: "token", type: "address" },
			{ name: "merchant", type: "address" },
			{ name: "amount", type: "uint256" },
			{ name: "paymentId", type: "bytes32" },
			{ name: "collateralOwner", type: "address" },
		],
		name: "executePayment",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ name: "paymentId", type: "bytes32" }],
		name: "isExecuted",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

export function createRouterAdapter(
	publicClient: PublicClient,
	walletClient: WalletClient,
	routerAddress: string,
): RouterAdapter {
	return {
		async executePayment(params: ExecutePaymentParams): Promise<ExecutePaymentResult> {
			const account = walletClient.account;
			if (!account) {
				throw new Error("Wallet client has no account");
			}

			const hash = await walletClient.writeContract({
				address: routerAddress as `0x${string}`,
				abi: ROUTER_ABI,
				functionName: "executePayment",
				args: [
					params.token as `0x${string}`,
					params.merchant as `0x${string}`,
					params.amount,
					params.paymentId as `0x${string}`,
					params.collateralOwner as `0x${string}`,
				],
				account,
				chain: null,
			});

			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			return {
				txHash: hash,
				blockNumber: Number(receipt.blockNumber),
				gasUsed: receipt.gasUsed,
			};
		},

		async isPaymentExecuted(paymentId: string): Promise<boolean> {
			return publicClient.readContract({
				address: routerAddress as `0x${string}`,
				abi: ROUTER_ABI,
				functionName: "isExecuted",
				args: [paymentId as `0x${string}`],
			});
		},
	};
}
