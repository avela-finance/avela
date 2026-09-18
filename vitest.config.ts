import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: ["node_modules/**", "resources/**", "apps/*/node_modules/**", "packages/*/node_modules/**", ".next/**"],
	},
});
