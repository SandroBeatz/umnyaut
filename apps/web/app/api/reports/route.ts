import { postReport } from "@server/api";

export async function POST(request: Request) {
  return postReport(request);
}
