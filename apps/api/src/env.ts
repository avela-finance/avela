import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	PRIVY_APP_ID: z.string().min(1),
	PRIVY_APP_SECRET: z.string().min(1),
	XLAYER_RPC_URL: z.string().url().default("https://rpc.xlayer.tech"),
	PORT: z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
		console.error(`Missing or invalid environment variables:\n${missing.join("\n")}`);
		process.exit(1);
	}
	return result.data;
}

export const env = loadEnv();
