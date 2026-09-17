export interface SignTransactionParams {
	chainId: number;
	to: string;
	value: string;
	data: string;
}

export interface WalletAdapter {
	getAddress(): Promise<string>;
	signTransaction(params: SignTransactionParams): Promise<string>;
}
