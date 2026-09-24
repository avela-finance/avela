import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
	appearance: {
		theme: "dark",
		accentColor: "#10b981",
	},
	loginMethods: ["google", "email", "wallet"],
	embeddedWallets: {
		ethereum: {
			createOnLogin: "users-without-wallets",
		},
	},
	supportedChains: [
		{
			id: 196,
			name: "X Layer",
			nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
			rpcUrls: {
				default: { http: ["https://rpc.xlayer.tech"] },
			},
			blockExplorers: {
				default: {
					name: "X Layer Explorer",
					url: "https://www.okx.com/web3/explorer/xlayer",
				},
			},
		},
	],
	defaultChain: {
		id: 196,
		name: "X Layer",
		nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
		rpcUrls: {
			default: { http: ["https://rpc.xlayer.tech"] },
		},
		blockExplorers: {
			default: {
				name: "X Layer Explorer",
				url: "https://www.okx.com/web3/explorer/xlayer",
			},
		},
	},
};
