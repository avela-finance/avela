import { AgentPermissionDeniedError } from "../errors.js";

export interface AgentPermissionData {
	allowedAssets: string[];
	maxTransaction: string;
	dailyLimit: string;
	approvedRecipients: string[];
	requireApproval: boolean;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

export interface AgentAction {
	asset: string;
	amount: string;
	dailySpentSoFar: string;
	recipient: string;
}

export function checkAgentPermission(permission: AgentPermissionData, action: AgentAction): void {
	if (permission.revokedAt !== null) {
		throw new AgentPermissionDeniedError("Permission has been revoked");
	}

	if (permission.expiresAt !== null && permission.expiresAt.getTime() < Date.now()) {
		throw new AgentPermissionDeniedError("Permission has expired");
	}

	if (!permission.allowedAssets.includes(action.asset)) {
		throw new AgentPermissionDeniedError(`Asset ${action.asset} not in allowed list`);
	}

	const amount = Number.parseFloat(action.amount);
	const maxTransaction = Number.parseFloat(permission.maxTransaction);
	if (amount > maxTransaction) {
		throw new AgentPermissionDeniedError(
			`Amount ${action.amount} exceeds max transaction ${permission.maxTransaction}`,
		);
	}

	const dailyTotal = Number.parseFloat(action.dailySpentSoFar) + amount;
	const dailyLimit = Number.parseFloat(permission.dailyLimit);
	if (dailyTotal > dailyLimit) {
		throw new AgentPermissionDeniedError(
			`Daily total ${dailyTotal} would exceed limit ${permission.dailyLimit}`,
		);
	}

	const isWildcard = permission.approvedRecipients.includes("*");
	if (!isWildcard && !permission.approvedRecipients.includes(action.recipient)) {
		throw new AgentPermissionDeniedError(`Recipient ${action.recipient} not approved`);
	}
}
