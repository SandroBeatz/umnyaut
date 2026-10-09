import { baseConfig } from "@umnyaut/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts", "test/**/*.test.ts"],
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts"],
        // Gate from tech spec §15: formulas are the biggest product risk.
        thresholds: { lines: 95 },
      },
    },
  }),
);
