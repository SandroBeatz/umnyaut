import { deleteProject, getProject, putProject } from "@server/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext<"/api/projects/[id]">) {
  return getProject(request, (await params).id);
}

export async function PUT(request: Request, { params }: RouteContext<"/api/projects/[id]">) {
  return putProject(request, (await params).id);
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/projects/[id]">) {
  return deleteProject(request, (await params).id);
}
