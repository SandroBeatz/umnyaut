"use client";

import type { Estimate } from "@umnyaut/calc";
import { estimatePage, popularTools, shell, site } from "@umnyaut/catalog";
import { Button, Mascot, ResponsiveSheet, toast } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Calculator, DoorOpen, Pencil, PiggyBank, SquareDashed } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useCountry } from "@/entities/country";
import { adoptEstimate, decodeSnapshot, hydrateEstimate, SNAPSHOT_PREFIX, useEstimateStore } from "@/entities/estimate";
import { ToolCard } from "@/entities/tool";
import { computeEstimate, saveTotals, useToolModules } from "@/features/estimate-totals";
import { mascotImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { areaText, estimateBoard } from "../model/board";
import { ExportActions } from "./ExportActions";
import { AddRoom, EmptyRoomCard, RoomCardView, SharedCard } from "./RoomCards";
import { TotalCard } from "./TotalCard";

const t = estimatePage;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** What the address holds after `#`: nothing, someone's estimate, or a link that does not open. */
type Link = { estimate: Estimate } | "broken" | undefined;

/**
 * The estimate itself (spec «Смета»): read after mount, the calculators of its calcs loaded on demand, recounted on
 * open and the header's totals saved (Р3). A link with a snapshot after `#` (Р14) shows that estimate for viewing
 * until «Забрать себе». Until then a placeholder of the same frame.
 */
export function EstimateBoard() {
  const [ready, setReady] = useState(false);
  const [link, setLink] = useState<Link>();
  useEffect(() => {
    const read = async () => {
      const { hash } = window.location;
      if (!hash.startsWith(SNAPSHOT_PREFIX)) return;
      const shared = await decodeSnapshot(hash.slice(SNAPSHOT_PREFIX.length));
      setLink(shared ? { estimate: shared } : "broken");
    };
    void hydrateEstimate()
      .then(read)
      .then(() => setReady(true));
    // A link opened in the same tab changes only the part after `#`.
    const onHash = () => void read();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (link !== "broken") return;
    toast.error(t.byLink.broken);
    leaveLink();
    setLink(undefined);
  }, [link]);
  const own = useEstimateStore((s) => s.estimate);
  const viewing = typeof link === "object" ? link.estimate : null;
  const estimate = viewing ?? own;
  const siteCountry = useCountry();
  const country = viewing ? viewing.country : siteCountry;
  const added = estimate?.calcs.filter((c) => c.addedAt !== undefined) ?? [];
  const moduleOf = useToolModules(ready ? added.map((c) => c.tool) : []);
  const aggregate = useMemo(
    () => (estimate && moduleOf ? computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined) : undefined),
    [estimate, moduleOf],
  );
  useEffect(() => {
    if (aggregate && !viewing) saveTotals(aggregate);
  }, [aggregate, viewing]);

  if (!ready || link === "broken" || (estimate && estimate.rooms.length > 0 && !aggregate)) return <Placeholder />;
  if (!estimate || !aggregate || estimate.rooms.length === 0) return <Empty />;

  const board = estimateBoard(estimate, aggregate, country);
  const readOnly = viewing !== null;
  const metrics: { icon: ReactNode; label: string; short?: string; value: string; accent?: boolean }[] = [
    { icon: <DoorOpen />, label: t.metrics.rooms, value: String(board.metrics.rooms) },
    {
      icon: <SquareDashed />,
      label: t.metrics.floor,
      value: board.metrics.floorM2 > 0 ? areaText(board.metrics.floorM2) : t.metrics.none,
    },
    { icon: <Calculator />, label: t.metrics.calcs, value: formatNumber(board.metrics.calcs) },
    {
      icon: <PiggyBank />,
      label: t.metrics.saved,
      short: t.metrics.savedShort,
      value: board.metrics.saved ?? t.metrics.none,
      accent: true,
    },
  ];

  return (
    <div data-estimate={readOnly ? "link" : "own"}>
      <p className="hidden text-small text-text-muted print:block">
        {fill(t.export.printed, { date: dateFormat.format(new Date()), site: new URL(site.url).host })}
      </p>
      {viewing ? (
        <SharedBanner
          theirs={viewing}
          onAdopted={() => {
            leaveLink();
            setLink(undefined);
          }}
        />
      ) : null}
      {readOnly ? <h1 className="mt-2 break-words text-h1">{estimate.name}</h1> : <EstimateName name={estimate.name} />}
      <p className="mt-1 text-small text-text-muted">{readOnly ? t.byLink.lead : t.lead}</p>

      <ul className="mt-5 grid grid-cols-2 print:hidden gap-3 lg:grid-cols-4 lg:gap-4">
        {metrics.map((m) => (
          <li
            key={m.label}
            className="flex min-h-20 items-center gap-3 rounded-lg border border-border px-3 lg:px-4"
            data-metric
          >
            <span
              aria-hidden="true"
              className={`hidden size-12 shrink-0 items-center justify-center rounded-full sm:flex [&_svg]:size-5 ${m.accent ? "bg-accent-soft text-accent-text" : "bg-primary-soft text-primary-hover"}`}
            >
              {m.icon}
            </span>
            <span className="flex min-w-0 flex-col">
              {m.short ? (
                <>
                  <span className="text-small text-text-muted sm:hidden">{m.short}</span>
                  <span className="hidden text-small text-text-muted sm:inline">{m.label}</span>
                </>
              ) : (
                <span className="text-small text-text-muted">{m.label}</span>
              )}
              <span className="text-body-strong tabular-nums">{m.value}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {board.rooms.map((card) => (
            <RoomCardView key={card.room.id} card={card} country={country} readOnly={readOnly} />
          ))}
          {board.shared.length > 0 ? <SharedCard board={board} country={country} /> : null}
          {board.empty.map((card) => (
            <EmptyRoomCard key={card.room.id} card={card} readOnly={readOnly} />
          ))}
          {readOnly ? null : <AddRoom />}
        </div>
        <TotalCard board={board} country={country}>
          <ExportActions estimate={estimate} board={board} country={country} link={!readOnly} />
        </TotalCard>
      </div>
    </div>
  );
}

/** Drops the snapshot from the address, so a reload shows this device's estimate. */
function leaveLink() {
  window.history.replaceState(window.history.state, "", window.location.pathname);
}

/** «Смета по ссылке · Забрать себе»: with an estimate of one's own, asks whether to replace it or add the rooms. */
function SharedBanner({ theirs, onAdopted }: { theirs: Estimate; onAdopted(): void }) {
  const [asking, setAsking] = useState(false);
  const adopt = (mode: "replace" | "add") => {
    const count = adoptEstimate(theirs, mode);
    setAsking(false);
    toast(mode === "add" ? fill(t.byLink.added, { count }) : t.byLink.adopted);
    onAdopted();
  };
  const take = (
    <Button variant="accent" size="md" className="self-start">
      {t.byLink.adopt}
    </Button>
  );
  const own = useEstimateStore((s) => s.estimate);
  return (
    <section
      aria-label={t.byLink.title}
      className="mt-2 flex flex-col gap-3 rounded-lg bg-surface-mint p-4 sm:flex-row sm:items-center print:hidden"
      data-estimate-link
    >
      <p className="min-w-0 flex-1 text-body-strong">{t.byLink.title}</p>
      {own && own.rooms.length > 0 ? (
        <ResponsiveSheet
          open={asking}
          onOpenChange={setAsking}
          title={t.byLink.question}
          description={t.byLink.questionLead}
          closeLabel={shell.close}
          trigger={take}
        >
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="primary" size="lg" onClick={() => adopt("add")}>
              {t.byLink.add}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => adopt("replace")}>
              {t.byLink.replace}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setAsking(false)}>
              {t.byLink.cancel}
            </Button>
          </div>
        </ResponsiveSheet>
      ) : (
        <Button variant="accent" size="md" className="self-start" onClick={() => adopt("replace")}>
          {t.byLink.adopt}
        </Button>
      )}
    </section>
  );
}

/** «Ремонт квартиры» with a pencil; the pencil turns the title into a field. */
function EstimateName({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("estimate-name");
          useEstimateStore.getState().rename(typeof value === "string" ? value : "");
          setEditing(false);
        }}
      >
        <input
          name="estimate-name"
          aria-label={t.nameLabel}
          defaultValue={name}
          maxLength={80}
          // biome-ignore lint/a11y/noAutofocus: the field replaces the title the user just asked to rename
          autoFocus
          className="h-12 min-w-0 flex-1 rounded-md border border-border-input bg-surface px-3 text-h3 focus-visible:outline-2 focus-visible:outline-focus"
        />
        <Button type="submit" variant="secondary" size="md">
          {t.save}
        </Button>
      </form>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-1">
      <h1 className="min-w-0 break-words text-h1">{name}</h1>
      <Button
        variant="ghost"
        size="icon"
        className="print:hidden"
        aria-label={t.rename}
        onClick={() => setEditing(true)}
      >
        <Pencil aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Same frame while the estimate is read and its calculators load: title line, metrics, one card. */
function Placeholder() {
  return (
    <div aria-busy="true" data-estimate-loading>
      <h1 className="sr-only">{t.title}</h1>
      <p className="sr-only" role="status">
        {t.loading}
      </p>
      <div className="mt-2 h-12 w-64 max-w-full animate-pulse rounded-md bg-surface-sunken" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-sunken" />
        ))}
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-lg bg-surface-sunken" />
    </div>
  );
}

/** No estimate on this device yet: what it is and where to start. */
function Empty() {
  return (
    <div className="flex flex-col items-center pt-4 text-center" data-estimate-empty>
      <Mascot image={mascotImages.hello} size={140} sizeLg={180} alt="" spot />
      <h1 className="mt-4 text-h1">{t.empty.title}</h1>
      <p className="mt-2 max-w-[34rem] text-body text-text-muted">{t.empty.lead}</p>
      <ul className="mt-6 grid w-full max-w-[960px] gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {popularTools().map(({ tool, note }) => (
          <li key={tool.id}>
            <ToolCard tool={tool} note={note} />
          </li>
        ))}
      </ul>
    </div>
  );
}
