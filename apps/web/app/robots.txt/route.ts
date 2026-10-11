import { robotsTxt } from "@server/seo";

// A route, not `robots.ts`: the metadata API has no `Clean-param` for Yandex.
export const dynamic = "force-static";

export function GET() {
  return new Response(robotsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
