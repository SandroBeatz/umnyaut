import { checkHealth } from "@server/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkHealth();
  return Response.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
