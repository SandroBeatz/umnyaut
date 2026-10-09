/**
 * localStorage that never throws: private mode, blocked storage and SSR all read as empty.
 * Keys are versioned (`umnyaut:<what>:v1`); see docs/ui/calculator-shell-and-pages.md → Where state lives.
 */
export function readStorage(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked: the calculator keeps working without memory.
  }
}

export function readJson<T>(key: string): T | undefined {
  const raw = readStorage(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
