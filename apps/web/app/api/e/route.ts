import { postEvent } from "@server/api";

export async function POST(request: Request) {
  return postEvent(request);
}
