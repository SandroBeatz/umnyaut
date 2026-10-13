import { estimatePage, shell } from "@umnyaut/catalog";
import { Mascot } from "@umnyaut/ui";
import { type Country, formatMoney, plural } from "@umnyaut/ui/format";
import { mascotImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import type { EstimateBoard } from "../model/board";

const t = estimatePage.total;

/** «Итого по смете» (spec «Смета»): the sum, a line per room and the shared consumables; on the phone at the end. */
export function TotalCard({ board, country }: { board: EstimateBoard; country: Country }) {
  const { sum, missing, byRoom } = board.total;
  return (
    <aside
      aria-labelledby="estimate-total"
      className="relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-md lg:sticky lg:top-6 lg:p-6"
      data-estimate-total
    >
      <header className="flex items-center gap-3">
        <h2 id="estimate-total" className="min-w-0 flex-1 text-body-strong text-text-muted">
          {t.title}
        </h2>
        <Mascot image={mascotImages.done} size={56} alt="" spot />
      </header>
      {sum > 0 ? (
        <p className="-mt-2 text-result tabular-nums" data-estimate-sum>
          {formatMoney(sum, country)}
        </p>
      ) : (
        <p className="text-small text-text-muted">{t.noPrices}</p>
      )}
      {sum > 0 && missing > 0 ? (
        <p className="-mt-2 text-small text-text-muted">
          {fill(shell.result.missing, { count: missing, positions: plural(missing, shell.result.positions) })}
        </p>
      ) : null}
      <ul>
        {byRoom.map((line) => (
          <li
            key={line.id}
            className="flex min-h-12 items-center justify-between gap-3 border-border border-t text-body"
          >
            <span className="min-w-0 truncate">{line.name}</span>
            {line.sum > 0 ? (
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(line.sum, country)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
