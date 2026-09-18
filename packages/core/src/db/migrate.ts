import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export async function runMigrations(url: string): Promise<void> {
	const client = postgres(url, { max: 1 });
	const db = drizzle(client);
	await migrate(db, { migrationsFolder: "./src/db/migrations" });
	await client.end();
}
