"use client";

import type { Estimate } from "@umnyaut/calc";
import { estimatePage, shell, site } from "@umnyaut/catalog";
import { Button, Logo } from "@umnyaut/ui";
import { formatMoney, plural } from "@umnyaut/ui/format";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { decodeSnapshot, SNAPSHOT_PREFIX } from "@/entities/estimate";
import { areaText } from "@/entities/room";
import { computeEstimate, useToolModules } from "@/features/estimate-totals";
import { fill } from "@/shared/lib";
import { type EstimateBoard, estimateBoard } from "../model/board";

const t = estimatePage.byLink;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** What the address holds after `#`: not read yet, the estimate, or nothing that opens. */
type Snapshot = Estimate | "broken" | undefined;

/**
 * Someone's estimate opened by link (Р14), as a document (owner, 2026-10-14): the logo, the name, a table per room,
 * the shared consumables, the total, how it was counted and the way to the home page. Nothing on it changes the
 * estimate; the site header and footer stay away (`[data-document]` in globals.css).
 */
export function SharedEstimate() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  useEffect(() => {
    const read = async () => {
      const { hash } = window.location;
      const shared = hash.startsWith(SNAPSHOT_PREFIX) ? await decodeSnapshot(hash.slice(SNAPSHOT_PREFIX.length)) : null;
      setSnapshot(shared ?? "broken");
    };
    void read();
    // A link opened in the same tab changes only the part after `#`.
    const onHash = () => void read();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const estimate = typeof snapshot === "object" ? snapshot : undefined;
  const added = estimate?.calcs.filter((c) => c.addedAt !== undefined) ?? [];
  const moduleOf = useToolModules(added.map((c) => c.tool));
  const board = useMemo(() => {
    if (!estimate || !moduleOf) return undefined;
    const aggregate = computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined);
    return estimateBoard(estimate, aggregate, estimate.country);
  }, [estimate, moduleOf]);

  return (
    // Room at the end for the cookie bar (≤ 96 px, fixed): the way home must scroll clear of it.
    <article className="mx-auto flex w-full max-w-[840px] flex-col px-4 pt-6 pb-32 sm:px-6 lg:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-border border-b pb-4">
        <Link href="/" aria-label={site.name} className="inline-flex min-h-12 items-center">
          <Logo label="" />
        </Link>
        {estimate ? (
          <p className="text-small text-text-muted">{fill(t.made, { date: dateFormat.format(estimate.updatedAt) })}</p>
        ) : null}
      </header>
      {snapshot === "broken" ? (
        <p className="mt-8 text-body" role="alert">
          {t.broken}
        </p>
      ) : estimate && board ? (
        <Document estimate={estimate} board={board} />
      ) : (
        <Placeholder />
      )}
      <footer className="mt-10 flex flex-col items-start gap-3 border-border border-t pt-6 print:hidden">
        <p className="text-body text-text-muted">{t.homeLead}</p>
        <Button asChild variant="accent" size="lg">
          <Link href="/">{t.home}</Link>
        </Button>
      </footer>
    </article>
  );
}

function Document({ estimate, board }: { estimate: Estimate; board: EstimateBoard }) {
  const country = estimate.country;
  const money = (sum: number | undefined) => (sum ? formatMoney(sum, country) : "");
  const priced = board.total.sum > 0;
  const { rooms, floorM2, calcs } = board.metrics;
  const summary = [
    `${rooms} ${plural(rooms, t.rooms)}`,
    ...(floorM2 > 0 ? [fill(t.floor, { area: areaText(floorM2) })] : []),
    `${calcs} ${plural(calcs, t.calcs)}`,
  ].join(" · ");
  const { sum, missing } = board.total;

  return (
    <div className="flex flex-col gap-8 pt-6" data-estimate="link">
      <div>
        <p className="text-small font-semibold text-primary-hover">{t.kicker}</p>
        <h1 className="mt-1 break-words text-h1">{estimate.name}</h1>
        <p className="mt-2 text-body text-text-muted">{summary}</p>
        <p className="mt-1 text-small text-text-muted">{t.lead}</p>
      </div>

      {board.rooms.map((card) => (
        <Section key={card.room.id} title={card.room.name} {...(card.size ? { note: card.size } : {})}>
          <Table priced={priced} {...(priced && card.sum > 0 ? { total: money(card.sum) } : {})}>
            {card.rows.flatMap((row) =>
              row.quantity ? (
                <Row
                  key={row.id}
                  title={row.title}
                  {...(row.caption ? { caption: row.caption } : {})}
                  quantity={row.quantity}
                  sum={priced ? money(row.cost) : undefined}
                />
              ) : (
                []
              ),
            )}
          </Table>
        </Section>
      ))}

      {board.empty.map((card) => (
        <Section key={card.room.id} title={card.room.name} {...(card.size ? { note: card.size } : {})}>
          <p className="border-border border-t py-3 text-body text-text-muted">{t.nothing}</p>
        </Section>
      ))}

      {board.shared.length > 0 ? (
        <Section title={estimatePage.shared.title} note={estimatePage.shared.lead} shared>
          <Table
            priced={priced}
            totalLabel={t.sharedTotal}
            {...(priced && board.sharedSum > 0 ? { total: money(board.sharedSum) } : {})}
          >
            {board.shared.map((row) => (
              <Row
                key={row.key}
                title={row.title}
                caption={[row.from, row.detail].filter(Boolean).join(" · ")}
                quantity={row.quantity}
                sum={priced ? money(row.cost) : undefined}
              />
            ))}
          </Table>
          {board.saving ? <p className="mt-3 text-small text-text-muted">{board.saving}</p> : null}
        </Section>
      ) : null}

      {priced ? (
        <div className="flex flex-col gap-1 rounded-lg bg-surface-mint p-4 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-body-strong">{t.total}</p>
          <div className="sm:text-right">
            <p className="text-result tabular-nums" data-estimate-sum>
              {money(sum)}
            </p>
            {missing > 0 ? (
              <p className="text-small text-text-muted">
                {fill(shell.result.missing, { count: missing, positions: plural(missing, shell.result.positions) })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <section aria-labelledby="estimate-about">
        <h2 id="estimate-about" className="text-h3">
          {t.about.title}
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body text-text-muted">
          {t.about.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Section({
  title,
  note,
  shared,
  children,
}: {
  title: string;
  note?: string;
  shared?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" {...(shared ? { "data-shared": true } : { "data-room-card": title })}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="text-h3">{title}</h2>
        {note ? <p className="text-small text-text-muted tabular-nums">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Table({
  priced,
  total,
  totalLabel = t.roomTotal,
  children,
}: {
  priced: boolean;
  total?: string;
  totalLabel?: string;
  children: ReactNode;
}) {
  const c = t.columns;
  return (
    <table className="w-full border-collapse text-left text-body">
      <thead>
        <tr className="border-border border-b text-small text-text-muted">
          <th scope="col" className="py-2 pr-3 font-medium">
            {c.material}
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            {c.quantity}
          </th>
          {priced ? (
            <th scope="col" className="w-28 py-2 text-right font-medium">
              {c.sum}
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>{children}</tbody>
      {total ? (
        <tfoot>
          <tr>
            <th scope="row" colSpan={2} className="py-2 pr-3 text-right text-small font-medium text-text-muted">
              {totalLabel}
            </th>
            <td className="py-2 text-right font-semibold tabular-nums">{total}</td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function Row({
  title,
  caption,
  quantity,
  sum,
}: {
  title: string;
  caption?: string;
  quantity: string;
  sum: string | undefined;
}) {
  return (
    <tr className="border-border border-b align-top" data-calc-row>
      <th scope="row" className="py-3 pr-3 font-normal">
        <span className="block text-body-strong">{title}</span>
        {caption ? <span className="block text-small text-text-muted">{caption}</span> : null}
      </th>
      <td className="py-3 pr-3 text-right tabular-nums">{quantity}</td>
      {sum === undefined ? null : <td className="py-3 text-right tabular-nums">{sum}</td>}
    </tr>
  );
}

/** Same frame while the link is read and its calculators load. */
function Placeholder() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 pt-6" data-estimate-loading>
      <p className="sr-only" role="status">
        {t.loading}
      </p>
      <div className="h-12 w-64 max-w-full animate-pulse rounded-md bg-surface-sunken" />
      <div className="h-64 animate-pulse rounded-lg bg-surface-sunken" />
    </div>
  );
}
