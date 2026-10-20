import type { Estimate } from "@umnyaut/calc";
import { snapshotOf } from "@/entities/estimate";
import { callApi, readJson, writeStorage } from "@/shared/lib";

/** The owner's short link: which estimate it shows, its id and the token that refreshes it (server keeps the hash). */
interface SavedLink {
  estimateId: string;
  id: string;
  editToken: string;
}

export const LINK_KEY = "umnyaut:estimate:link:v1";
export const PROJECT_PATH = "/p/";

const linkUrl = (id: string) => `${window.location.origin}${PROJECT_PATH}${id}/`;

function savedFor(estimateId: string): SavedLink | undefined {
  const saved = readJson<SavedLink>(LINK_KEY);
  return saved?.estimateId === estimateId && typeof saved.id === "string" && typeof saved.editToken === "string"
    ? saved
    : undefined;
}

/**
 * The short link `/p/<id>/` with the estimate as it is now (P17.17): the first time a new snapshot, after that the
 * same link refreshed by the owner's token. A refresh answered 404 (deleted, cleaned up after 12 months, token from
 * another device) makes a new link. `undefined` when the server cannot help — no DB on staging, offline, too large,
 * over the limit — and the caller falls back to the `#` snapshot (Р14).
 */
export async function shortLink(estimate: Estimate): Promise<string | undefined> {
  const data = snapshotOf(estimate);
  const saved = savedFor(estimate.id);
  if (saved) {
    const updated = await callApi(`/api/projects/${saved.id}/`, {
      method: "PUT",
      body: { data },
      headers: { "x-edit-token": saved.editToken },
    });
    if (updated.ok) return linkUrl(saved.id);
    if (updated.code !== "not_found") return undefined;
  }
  const created = await callApi<{ id: string; editToken: string }>("/api/projects/", {
    method: "POST",
    body: { data },
  });
  if (!created.ok) return undefined;
  const { id, editToken } = created.data;
  writeStorage(LINK_KEY, JSON.stringify({ estimateId: estimate.id, id, editToken } satisfies SavedLink));
  return linkUrl(id);
}
