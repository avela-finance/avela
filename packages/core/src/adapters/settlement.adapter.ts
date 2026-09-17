export interface TransferParams {
	to: string;
	asset: string;
	amount: string;
	chainId: number;
	tokenAddress: string;
}

export interface TransferResult {
	txHash: string;
	confirmed: boolean;
}

export interface TransferConfirmation {
	confirmed: boolean;
	blockNumber: number;
}

export interface SettlementAdapter {
	transfer(params: TransferParams): Promise<TransferResult>;
	confirmTransfer(txHash: string, chainId: number): Promise<TransferConfirmation>;
}
