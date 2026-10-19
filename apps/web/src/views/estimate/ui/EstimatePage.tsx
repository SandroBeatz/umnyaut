import { estimatePage, shell } from "@umnyaut/catalog";
import { Breadcrumbs } from "@/shared/ui";
import { EstimateBoard } from "./EstimateBoard";

/**
 * `/spisok/` (spec «Смета», P17.11): a static frame; the estimate lives in the browser, so everything below the
 * breadcrumbs appears after mount. At least a screen tall, so the footer never starts on the first screen and jumps
 * down once the list replaces the placeholder (CLS, P17.15).
 */
export function EstimatePage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1200px] px-4 pb-12 sm:px-6 lg:px-8">
      <Breadcrumbs
        label={shell.breadcrumbs.label}
        trail={[{ href: "/", label: shell.breadcrumbs.home }]}
        current={estimatePage.crumb}
      />
      <EstimateBoard />
    </main>
  );
}
