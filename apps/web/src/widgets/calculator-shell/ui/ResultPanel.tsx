import { shell, type ToolDef } from "@umnyaut/catalog";
import { categoryIcons, cn, Mascot, MaterialThumb } from "@umnyaut/ui";
import { Calculator, Info } from "lucide-react";
import type { Ref } from "react";
import { mascotImages, materialImages } from "@/shared/config";
import { Hint } from "@/shared/ui";
import type { ResultView } from "../model/view";

const r = shell.result;

const photoOf = (key: string | undefined) =>
  key && key in materialImages ? materialImages[key as keyof typeof materialImages] : undefined;

export interface ResultPanelProps {
  tool: ToolDef;
  view: ResultView;
  example: boolean;
  stale: boolean;
  ref?: Ref<HTMLElement>;
}

/**
 * «Нужно купить» card (design spec §11): mascot `done` in the header line (adds no height), the main figure,
 * warnings right under it, related items, summary tiles, total. The numbers are in the server HTML.
 */
export function ResultPanel({ tool, view, example, stale, ref }: ResultPanelProps) {
  const CategoryIcon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
  const { main } = view;
  return (
    <section
      ref={ref}
      id="result"
      aria-label={r.region}
      className="scroll-mt-20 rounded-lg border border-border bg-surface px-4 pt-3 pb-4 shadow-md lg:p-6"
    >
      <header className="-mt-2 flex min-h-14 items-center gap-3 lg:-mt-1">
        <Mascot image={mascotImages.done} size={56} alt="" spot />
        <div className="min-w-0">
          <p className="text-small font-semibold text-text">
            {example ? r.example : view.mode === "buy" ? r.buy : r.measure}
          </p>
          {main ? <p className="text-small text-text-muted">{main.title}</p> : null}
        </div>
      </header>

      {main ? (
        <div className="mt-1 flex items-center gap-3">
          {view.mode === "buy" ? (
            <MaterialThumb image={photoOf(main.photo)} fallbackIcon={<CategoryIcon />} alt="" size={64} />
          ) : null}
          <div className="min-w-0" aria-live="polite" aria-atomic="true">
            <p className={cn("tabular-nums transition-opacity duration-150", stale && "opacity-60")}>
              <span className="sr-only">{main.title}: </span>
              <span className="text-result" data-result-value>
                {main.value}
              </span>{" "}
              <span className="text-result-unit">{main.unit}</span>
            </p>
            {main.caption ? <p className="text-small text-text-muted tabular-nums">{main.caption}</p> : null}
          </div>
        </div>
      ) : null}

      {stale ? <p className="mt-2 text-small text-danger">{r.stale}</p> : null}

      {view.warnings.length > 0 ? (
        <Hint className="mt-4">
          <p className="sr-only">{shell.warningsTitle}</p>
          <ul className="flex flex-col gap-1">
            {view.warnings.map((w) => (
              <li key={w.code}>{w.text}</li>
            ))}
          </ul>
        </Hint>
      ) : null}

      {tool.disclaimer ? (
        <p className="mt-4 flex gap-2 rounded-md border border-border p-3 text-small text-text-muted">
          <Info aria-hidden="true" className="size-5 shrink-0 text-primary" />
          {shell.disclaimer}
        </p>
      ) : null}

      {view.related.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-small font-semibold text-text-muted">{r.related}</h3>
          <ul className="mt-1 divide-y divide-border">
            {view.related.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-2">
                <MaterialThumb image={photoOf(item.photo)} fallbackIcon={<CategoryIcon />} alt="" size={56} />
                <span className="flex flex-1 flex-col">
                  <span className="text-body">{item.title}</span>
                  {item.detail ? <span className="text-small text-text-muted tabular-nums">{item.detail}</span> : null}
                </span>
                <span className="text-quantity tabular-nums" data-result-value>
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {view.tiles.length > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-2">
          {view.tiles.map((tile) => (
            <div key={tile.key} className="rounded-md bg-surface-sunken p-3">
              <dt className="text-small text-text-muted">{tile.label}</dt>
              <dd className="text-h3 tabular-nums" data-result-value>
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {view.total ? (
        <p className="mt-4 border-border border-t pt-3 text-body-strong tabular-nums">
          {view.total.text}
          {view.total.missing ? <span className="text-small text-text-muted"> · {view.total.missing}</span> : null}
        </p>
      ) : null}
    </section>
  );
}
