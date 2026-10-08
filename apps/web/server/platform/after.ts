import "server-only";
import { after } from "next/server";

/** Post-response work (counters, cleanup). Errors are logged, never surfaced to the user. */
export function runAfter(task: () => unknown | Promise<unknown>): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error("[after] task failed", error);
    }
  });
}
