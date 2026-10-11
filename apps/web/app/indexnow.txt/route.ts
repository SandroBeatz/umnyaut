import { getEnv } from "@server/platform";

// IndexNow key file (plan P9.8): the deploy workflow reads the key here, search engines check it here.
export const dynamic = "force-dynamic";

export function GET() {
  const key = getEnv().INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
