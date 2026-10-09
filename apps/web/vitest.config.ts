import { fileURLToPath } from "node:url";
import { baseConfig } from "@umnyaut/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        "@/": fileURLToPath(new URL("./src/", import.meta.url)),
        "@server/": fileURLToPath(new URL("./server/", import.meta.url)),
        // `server-only` throws outside the react-server condition; tests run server code directly.
        "server-only": fileURLToPath(new URL("./server/platform/test-server-only.ts", import.meta.url)),
      },
    },
  }),
);
