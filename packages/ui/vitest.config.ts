import { baseConfig } from "@umnyaut/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({ test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] } }),
);
