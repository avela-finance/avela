import type { PublicClient } from "viem";

export interface VaultAdapter {
	getLockedBalance(depositor: string, token: string): Promise<bigint>;
}

const VAULT_ABI = [
	{
		inputs: [
			{ name: "depositor", type: "address" },
			{ name: "token", type: "address" },
		],
		name: "getLockedBalance",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

export function createVaultAdapter(publicClient: PublicClient, vaultAddress: string): VaultAdapter {
	return {
		async getLockedBalance(depositor: string, token: string): Promise<bigint> {
			const balance = await publicClient.readContract({
				address: vaultAddress as `0x${string}`,
				abi: VAULT_ABI,
				functionName: "getLockedBalance",
				args: [depositor as `0x${string}`, token as `0x${string}`],
			});
			return balance;
		},
	};
}
