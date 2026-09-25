import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [
			"apps/*/src/**/*.test.ts",
			"apps/*/**/__tests__/**/*.test.ts",
			"packages/*/src/**/*.test.ts",
		],
		exclude: ["**/node_modules/**", "**/.next/**", "resources/**", "contracts/**"],
		// DB integration tests share one database with fixed IDs — run test
		// files serially so parallel workers can't collide on the same rows.
		// NOTE: `poolOptions.forks.singleFork` was removed in Vitest 4 and is
		// silently ignored (v5 logs a deprecation warning) — fileParallelism
		// is the supported switch.
		pool: "forks",
		fileParallelism: false,
	},
});
