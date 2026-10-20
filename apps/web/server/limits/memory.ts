import "server-only";

interface Window {
  start: number;
  count: number;
}

/**
 * Fixed-window counter in the process memory: absorbs bursts without a DB round trip. Lost on restart and not shared
 * between the blue and green containers — fine for per-minute limits; daily ones go to Postgres.
 */
export class MemoryLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(private readonly maxKeys = 50_000) {}

  hit(key: string, max: number, windowMs: number, now: number): boolean {
    const start = Math.floor(now / windowMs) * windowMs;
    const current = this.windows.get(key);
    if (current && current.start === start) {
      current.count += 1;
      return current.count <= max;
    }
    if (this.windows.size >= this.maxKeys) this.prune(now, windowMs);
    this.windows.set(key, { start, count: 1 });
    return max >= 1;
  }

  /** Drops windows that ended; if every key is live, drops the oldest half. */
  private prune(now: number, windowMs: number) {
    for (const [key, w] of this.windows) if (w.start + windowMs <= now) this.windows.delete(key);
    if (this.windows.size < this.maxKeys) return;
    let drop = Math.floor(this.windows.size / 2);
    for (const key of this.windows.keys()) {
      if (drop-- <= 0) break;
      this.windows.delete(key);
    }
  }
}
