export interface AuthUser {
	externalUserId: string;
	walletAddress: string;
}

export interface AuthAdapter {
	verifyToken(token: string): Promise<{ userId: string }>;
	getUser(userId: string): Promise<AuthUser | null>;
}
