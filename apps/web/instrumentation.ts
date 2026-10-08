export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail fast: Next only logs instrumentation errors and keeps serving 500s, so exit explicitly.
    const { getEnv } = await import("@server/platform/env");
    try {
      getEnv();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
