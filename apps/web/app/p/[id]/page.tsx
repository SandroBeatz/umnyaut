import { loadSharedProject } from "@server/pages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedEstimatePage, sharedProjectMetadata } from "@/views/estimate";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await loadSharedProject(id);
  return project ? sharedProjectMetadata(id, project.data) : {};
}

export default async function Page({ params }: PageProps<"/p/[id]">) {
  const project = await loadSharedProject((await params).id);
  if (!project) notFound();
  return <SharedEstimatePage data={project.data} />;
}
