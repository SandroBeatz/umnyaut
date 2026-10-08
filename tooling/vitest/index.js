import { defineConfig } from "vitest/config";

/** Shared Vitest defaults; packages merge their own settings with `mergeConfig`. */
export const baseConfig = defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
    },
  },
});
