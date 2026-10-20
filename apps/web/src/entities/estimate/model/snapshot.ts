import { type Estimate, migrateProject } from "@umnyaut/calc";

/** A longer link breaks in messengers; past it the page suggests print / PDF (spec «Экспорт», Р14). */
export const SNAPSHOT_MAX = 8 * 1024;
/** The unpacked JSON never comes near it; past it a link is a deflate bomb, not an estimate. */
const UNPACKED_MAX = 256 * 1024;
/** `/spisok/#s=<snapshot>`. */
export const SNAPSHOT_PREFIX = "#s=";

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** Unpacks at most `limit` bytes: a hostile link stops there instead of filling the memory. */
async function inflate(bytes: Uint8Array<ArrayBuffer>, limit: number): Promise<Uint8Array | null> {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

const binary = (bytes: Uint8Array) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
};

/**
 * What a receiver of the estimate needs — rooms, calcs in the estimate and prices; no totals, active room, drafts or
 * open times. Same for the `#` link and the short link `/p/<id>`.
 */
export function snapshotOf(estimate: Estimate): Estimate {
  const { totals: _, activeRoomId: __, ...rest } = estimate;
  const calcs = rest.calcs
    .filter((c) => c.addedAt !== undefined)
    .map(({ openedAt: _o, draft: _d, ...c }) => ({ ...c, openedAt: 0 }));
  return { ...rest, calcs };
}

/**
 * The estimate in a link without a server (Р14): the snapshot deflated and base64url'ed. The input of a calc is only
 * what differs from defaults, so it stays short.
 */
export async function encodeSnapshot(estimate: Estimate): Promise<string> {
  const json = JSON.stringify(snapshotOf(estimate));
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream("deflate-raw"));
  // base64url of the bytes themselves (`toBase64Url` in shared/lib encodes text).
  return btoa(binary(packed)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The shared estimate, or `null` for a broken or foreign snapshot. */
export async function decodeSnapshot(value: string): Promise<Estimate | null> {
  // We never make a longer one (ExportActions), so a longer one is not ours.
  if (value.length > SNAPSHOT_MAX || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = await inflate(
      Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      UNPACKED_MAX,
    );
    if (!bytes) return null;
    const result = migrateProject(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}
