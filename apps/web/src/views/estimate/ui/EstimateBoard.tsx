"use client";

import { estimatePage, popularTools } from "@umnyaut/catalog";
import { Button, Mascot } from "@umnyaut/ui";
import { formatNumber } from "@umnyaut/ui/format";
import { Calculator, DoorOpen, Pencil, PiggyBank, SquareDashed } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { hydrateEstimate, useEstimateStore } from "@/entities/estimate";
import { ToolCard } from "@/entities/tool";
import { computeEstimate, saveTotals, useToolModules } from "@/features/estimate-totals";
import { mascotImages } from "@/shared/config";
import { areaText, estimateBoard } from "../model/board";
import { AddRoom, EmptyRoomCard, RoomCardView, SharedCard } from "./RoomCards";
import { TotalCard } from "./TotalCard";

const t = estimatePage;

/**
 * The estimate itself (spec «Смета»): read after mount, the calculators of its calcs loaded on demand, recounted on
 * open and the header's totals saved (Р3). Until then a placeholder of the same frame.
 */
export function EstimateBoard() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void hydrateEstimate().then(() => setReady(true));
  }, []);
  const estimate = useEstimateStore((s) => s.estimate);
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

  const board = estimateBoard(estimate, aggregate, estimate.country);
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
    <div data-estimate>
      <EstimateName name={estimate.name} />
      <p className="mt-1 text-small text-text-muted">{t.lead}</p>

      <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
            <RoomCardView key={card.room.id} card={card} country={estimate.country} />
          ))}
          {board.shared.length > 0 ? <SharedCard board={board} country={estimate.country} /> : null}
          {board.empty.map((card) => (
            <EmptyRoomCard key={card.room.id} card={card} />
          ))}
          <AddRoom />
        </div>
        <TotalCard board={board} country={estimate.country} />
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
    <div className="mt-2 flex items-center gap-1">
      <h1 className="min-w-0 break-words text-h1">{name}</h1>
      <Button variant="ghost" size="icon" aria-label={t.rename} onClick={() => setEditing(true)}>
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
