import { z } from "zod";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");
const privateKeySchema = z
	.string()
	.regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key (expected 0x + 64 hex chars)");

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	SUPABASE_URL: z.string().url(),
	SUPABASE_ANON_KEY: z.string().min(1),
	PRIVY_APP_ID: z.string().min(1),
	PRIVY_APP_SECRET: z.string().min(1),
	XLAYER_RPC_URL: z.string().url().default("https://rpc.xlayer.tech"),
	PORT: z.coerce.number().default(3001),
	AVELA_VAULT_ADDRESS: addressSchema,
	AVELA_ROUTER_ADDRESS: addressSchema,
	SIGNER_PRIVATE_KEY: privateKeySchema,
	WHATSAPP_API_TOKEN: z.string().min(1).optional(),
	WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
	WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
	ALLOWED_ORIGINS: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
	if (!cached) {
		const result = envSchema.safeParse(process.env);
		if (!result.success) {
			const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
			throw new Error(`Missing or invalid environment variables:\n${missing.join("\n")}`);
		}
		cached = result.data;
	}
	return cached;
}
