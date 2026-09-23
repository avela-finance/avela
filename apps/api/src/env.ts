import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	SUPABASE_URL: z.string().url(),
	SUPABASE_ANON_KEY: z.string().min(1),
	PRIVY_APP_ID: z.string().min(1),
	PRIVY_APP_SECRET: z.string().min(1),
	XLAYER_RPC_URL: z.string().url().default("https://rpc.xlayer.tech"),
	PORT: z.coerce.number().default(3001),
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
