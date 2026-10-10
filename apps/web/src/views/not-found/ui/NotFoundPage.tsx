import { popularTools, shell } from "@umnyaut/catalog";
import { Button, Mascot } from "@umnyaut/ui";
import Link from "next/link";
import { ToolCard } from "@/entities/tool";
import { mascotImages } from "@/shared/config";

const t = shell.notFound;

/** 404 (design spec §13): cat `oops`, the same six popular tools as the home page, a way home. */
export function NotFoundPage() {
  const popular = popularTools();
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col items-center text-center">
        <Mascot image={mascotImages.oops} size={160} sizeLg={240} alt={t.mascotAlt} spot priority />
        <h1 className="mt-4 text-h1">{t.title}</h1>
        <p className="mt-2 max-w-[34rem] text-body text-text-muted">{t.lead}</p>
      </div>
      <ul className="mx-auto mt-6 grid max-w-[960px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {popular.map(({ tool, note }) => (
          <li key={tool.id}>
            <ToolCard tool={tool} note={note} />
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center">
        <Button asChild size="lg">
          <Link href="/">{t.home}</Link>
        </Button>
      </div>
    </main>
  );
}
