import { postProject } from "@server/api";

export async function POST(request: Request) {
  return postProject(request);
}
