import { shell, type ToolDef } from "@umnyaut/catalog";
import { categoryIcons, cn, Mascot, MaterialThumb } from "@umnyaut/ui";
import { Bolt, Calculator, Info, TubeLotion } from "lucide-react";
import type { Ref } from "react";
import type { SharedItemView } from "@/features/estimate-totals";
import { mascotImages, materialImages } from "@/shared/config";
import { fill } from "@/shared/lib";
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
  /** The active room's name: «Нужно купить · Ванная». */
  room?: string;
  /** Shared consumables counted with the estimate, by item key (loaded after mount). */
  shared?: Readonly<Record<string, SharedItemView>>;
  ref?: Ref<HTMLElement>;
}

/**
 * «Нужно купить» card (design spec §11): mascot `done` in the header line (adds no height), the main figure,
 * warnings right under it, related items, summary tiles, total. The numbers are in the server HTML.
 */
export function ResultPanel({ tool, view, example, stale, room, shared, ref }: ResultPanelProps) {
  const CategoryIcon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
  const { main } = view;
  return (
    <section
      ref={ref}
      id="result"
      aria-label={r.region}
      className="relative scroll-mt-20 rounded-lg border border-border bg-surface px-4 pt-3 pb-4 shadow-md lg:p-6"
    >
      {/* The cat in a mint circle at the card's corner; from 1024 px it stands out over the edge. Absolute, so the
          number stays where it was (rule 8). */}
      <span
        aria-hidden="true"
        className="absolute top-2 right-3 flex size-[72px] items-center justify-center rounded-full bg-surface-mint lg:-top-10 lg:right-6 lg:size-28"
      >
        {/* The cat is taller than wide: it fits the circle whole, ears to paws. */}
        <Mascot image={mascotImages.done} size={54} sizeLg={84} alt="" />
      </span>
      {/* The heading keeps clear of the cat in the corner. */}
      <header className="-mt-1 flex min-h-12 items-center pr-20 lg:pr-32">
        <p className="min-w-0 text-body-strong text-text-muted">
          {example ? r.example : view.mode === "buy" ? (room ? fill(r.buyIn, { buy: r.buy, room }) : r.buy) : r.measure}
        </p>
      </header>

      {main ? (
        <div className="mt-1 flex items-center gap-3">
          {view.mode === "buy" ? (
            <MaterialThumb image={photoOf(main.photo)} fallbackIcon={<CategoryIcon />} alt="" size={64} />
          ) : null}
          <div className="min-w-0 flex-1" aria-live="polite" aria-atomic="true">
            <p className={cn("tabular-nums transition-opacity duration-150", stale && "opacity-60")}>
              <span className="sr-only">{main.title}: </span>
              <span className="text-result" data-result-value>
                {main.value}
              </span>{" "}
              <span className="text-result-unit">{main.unit}</span>
            </p>
            {/* The dot sticks to the word before it, so a line never starts with «·». */}
            <p className="text-small text-text-muted tabular-nums">
              <span className="font-semibold text-text">{main.title}</span>
              {main.caption ? `\u00a0· ${main.caption.replaceAll(" · ", "\u00a0· ")}` : null}
            </p>
            {/* Phone: the cost under the caption, so the caption keeps the width; wider: on the right. */}
            {main.cost ? <p className="mt-0.5 text-body-strong tabular-nums sm:hidden">{main.cost}</p> : null}
          </div>
          {main.cost ? (
            <p className="hidden shrink-0 text-h3 font-extrabold tabular-nums sm:block">{main.cost}</p>
          ) : null}
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
        <div className="mt-5">
          <h3 className="text-caption font-semibold tracking-wide text-text-muted uppercase">
            {view.related.some((item) => shared?.[item.key]) ? r.relatedEstimate : r.related}
          </h3>
          <ul className="mt-1 divide-y divide-border">
            {view.related.map((item) => {
              const merged = shared?.[item.key];
              const detail = merged?.share ?? item.detail;
              return (
                <li key={item.key} className="flex items-center gap-3 py-2.5">
                  <MaterialThumb
                    image={photoOf(item.photo)}
                    fallbackIcon={
                      item.icon === "fastener" ? <Bolt /> : item.icon === "tube" ? <TubeLotion /> : <CategoryIcon />
                    }
                    alt=""
                    size={56}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-strong">{item.title}</span>
                    {detail ? <span className="text-small text-text-muted tabular-nums">{detail}</span> : null}
                  </span>
                  {/* Phone: quantity over its price; wider: side by side in two columns. */}
                  <span className="flex shrink-0 flex-col items-end tabular-nums sm:flex-row sm:items-center sm:gap-6">
                    <span className="text-quantity" data-result-value>
                      {merged?.total ?? item.quantity}
                    </span>
                    {item.cost ? (
                      <span className="text-small text-text-muted sm:min-w-20 sm:text-right sm:text-body-strong sm:text-text">
                        {item.cost}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {view.related
            .flatMap((item) => shared?.[item.key]?.saving ?? [])
            .map((saving) => (
              <Hint key={saving} className="mt-2">
                {saving}
              </Hint>
            ))}
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
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-md bg-surface-mint px-4 py-3"
          data-result-total
        >
          <p className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="text-body-strong">{r.totalLabel}</span>
            {view.total.note ? (
              <span className="text-small text-text-muted tabular-nums">{view.total.note}</span>
            ) : null}
            {view.total.missing ? <span className="text-small text-text-muted">{view.total.missing}</span> : null}
          </p>
          <p className="shrink-0 text-h2 font-extrabold tabular-nums">{view.total.amount}</p>
        </div>
      ) : null}
    </section>
  );
}
