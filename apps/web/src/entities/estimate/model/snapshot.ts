import { type Estimate, migrateProject } from "@umnyaut/calc";

/** A longer link breaks in messengers; past it the page suggests print / PDF (spec «Экспорт», Р14). */
export const SNAPSHOT_MAX = 8 * 1024;
/** `/smeta/#s=<snapshot>`. */
export const SNAPSHOT_PREFIX = "#s=";

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const binary = (bytes: Uint8Array) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
};

/**
 * The estimate in a link without a server (Р14): what the receiver needs — rooms, calcs and prices, no totals or
 * active room — deflated and base64url'ed. The input of a calc is only what differs from defaults, so it stays short.
 */
export async function encodeSnapshot(estimate: Estimate): Promise<string> {
  const { totals: _, activeRoomId: __, ...rest } = estimate;
  const calcs = rest.calcs
    .filter((c) => c.addedAt !== undefined)
    .map(({ openedAt: _o, draft: _d, ...c }) => ({ ...c, openedAt: 0 }));
  const json = JSON.stringify({ ...rest, calcs });
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream("deflate-raw"));
  // base64url of the bytes themselves (`toBase64Url` in shared/lib encodes text).
  return btoa(binary(packed)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The shared estimate, or `null` for a broken or foreign snapshot. */
export async function decodeSnapshot(value: string): Promise<Estimate | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = await pipe(
      Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      new DecompressionStream("deflate-raw"),
    );
    const result = migrateProject(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}
