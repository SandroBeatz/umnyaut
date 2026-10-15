"use client";

import { estimatePage, popularTools, site } from "@umnyaut/catalog";
import { Button, cn, Mascot } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Calculator, DoorOpen, Pencil, PiggyBank, SquareDashed } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useCountry } from "@/entities/country";
import { hydrateEstimate, SNAPSHOT_PREFIX, useEstimateStore } from "@/entities/estimate";
import { areaText } from "@/entities/room";
import { ToolCard } from "@/entities/tool";
import { computeEstimate, saveTotals, useToolModules } from "@/features/estimate-totals";
import { mascotImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { estimateBoard } from "../model/board";
import { SHARED_ESTIMATE_PATH } from "../model/link";
import { ExportActions } from "./ExportActions";
import { AddRoom, EmptyRoomCard, RoomCardView, SharedCard } from "./RoomCards";
import { TotalCard } from "./TotalCard";

const t = estimatePage;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/**
 * The estimate itself (spec «Смета»): read after mount, the calculators of its calcs loaded on demand, recounted on
 * open and the header's totals saved (Р3). Until then a placeholder of the same frame. A link from before the page
 * of its own (`/spisok/#s=…`, Р14) goes on to `/spisok/prosmotr/`.
 */
export function EstimateBoard() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { hash } = window.location;
    if (hash.startsWith(SNAPSHOT_PREFIX)) {
      window.location.replace(`${SHARED_ESTIMATE_PATH}${hash}`);
      return;
    }
    void hydrateEstimate().then(() => setReady(true));
  }, []);
  const estimate = useEstimateStore((s) => s.estimate);
  const country = useCountry();
  const added = estimate?.calcs.filter((c) => c.addedAt !== undefined) ?? [];
  const moduleOf = useToolModules(ready ? added.map((c) => c.tool) : []);
  const aggregate = useMemo(
    () => (estimate && moduleOf ? computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined) : undefined),
    [estimate, moduleOf],
  );
  useEffect(() => {
    if (aggregate) saveTotals(aggregate);
  }, [aggregate]);

  if (!ready || (estimate && estimate.rooms.length > 0 && !aggregate)) return <Placeholder />;
  if (!estimate || !aggregate || estimate.rooms.length === 0) return <Empty />;

  const board = estimateBoard(estimate, aggregate, country);
  const counted = board.rooms.length > 0;
  const metrics: { icon: ReactNode; label: string; value: string; accent?: boolean }[] = [
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
      value: board.metrics.saved ?? t.metrics.none,
      accent: true,
    },
  ];

  return (
    <div data-estimate="own">
      <p className="hidden text-small text-text-muted print:block">
        {fill(t.export.printed, { date: dateFormat.format(new Date()), site: new URL(site.url).host })}
      </p>
      <EstimateName name={estimate.name} />
      <p className="mt-1 text-small text-text-muted">{t.lead}</p>

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
              <span className="text-small text-text-muted">{m.label}</span>
              <span className="text-body-strong tabular-nums">{m.value}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Nothing counted yet: no total and nothing to export — the rooms take the width. */}
      <div className={cn("mt-8 grid gap-6", counted && "lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start")}>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {board.rooms.map((card) => (
            <RoomCardView key={card.room.id} card={card} country={country} />
          ))}
          {board.shared.length > 0 ? <SharedCard board={board} country={country} /> : null}
          {board.empty.map((card) => (
            <EmptyRoomCard key={card.room.id} card={card} />
          ))}
          <AddRoom />
        </div>
        {counted ? (
          <TotalCard board={board} country={country}>
            <ExportActions estimate={estimate} board={board} country={country} />
          </TotalCard>
        ) : null}
      </div>
    </div>
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
    <div className="mt-2 flex items-center gap-2">
      <h1 className="min-w-0 break-words text-h1">{name}</h1>
      {/* A 32 px button beside the title; the tap area is 48 px all the same (`after:` widens it unseen). */}
      <button
        type="button"
        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-primary transition-colors after:absolute after:-inset-2 hover:bg-primary-soft hover:text-primary-hover print:hidden"
        aria-label={t.rename}
        onClick={() => setEditing(true)}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
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
