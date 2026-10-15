"use client";

import { ESTIMATE_LIMITS, type Estimate } from "@umnyaut/calc";
import { home } from "@umnyaut/catalog";
import { Button } from "@umnyaut/ui";
import { type Country, formatMoney, plural } from "@umnyaut/ui/format";
import { ArrowRight, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { freeRoomName, useEstimateStore } from "@/entities/estimate";
import { nameForType, RoomEditor } from "@/features/edit-room";
import { fill } from "@/shared/lib";
import { freshType, ROOMS_SHOWN, type RoomLine, roomCount, roomLines } from "../model/rooms";
import { roomIcons } from "./roomIcons";
import { SuggestionsSheet } from "./SuggestionsSheet";

const r = home.rooms;
const LIST_PATH = "/spisok/";

/** Opens the room in its calculator: the room becomes the active one, its calc the last opened (scenario 4). */
const open = (line: RoomLine) => {
  const store = useEstimateStore.getState();
  store.setActiveRoom(line.id);
  if (line.calcId) store.openCalc(line.calcId);
};

/**
 * Second state of the home room block (`docs/ui/home-room-block.md`): «Ваш ремонт» — the estimate's rooms with
 * their sums, «Итого по списку», «Открыть список» and «Добавить комнату»: the room editor with «Посчитать материалы»,
 * then the new room's usual calculators.
 */
export function RoomsList({ estimate, country, onAll }: { estimate: Estimate; country: Country; onAll(): void }) {
  const [editing, setEditing] = useState(false);
  const [savedId, setSavedId] = useState<string>();
  const addRef = useRef<HTMLButtonElement>(null);
  const saved = estimate.rooms.find((r) => r.id === savedId);
  const newType = freshType(estimate.rooms);
  const newName = nameForType(
    newType,
    "",
    freeRoomName(estimate.rooms),
    estimate.rooms.map((r) => r.name),
  );
  const ceiling = estimate.rooms.find((r) => r.id === estimate.activeRoomId)?.heightMm;
  const lines = roomLines(estimate);
  const shown = lines.slice(0, ROOMS_SHOWN);
  const more = lines.length - shown.length;
  const sum = estimate.totals?.sum ?? 0;

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3">{r.title}</h2>
        <span className="text-small text-text-muted">{roomCount(lines.length)}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {shown.map((line) => {
          const Icon = roomIcons[line.type];
          return (
            <li key={line.id}>
              <Link
                href={line.href}
                onClick={() => open(line)}
                aria-label={`${fill(r.open, { room: line.name })}. ${line.meta}${
                  line.sum > 0 ? `, ${formatMoney(line.sum, country)}` : ""
                }`}
                className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-input"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-mint text-primary-hover [&_svg]:size-6"
                >
                  <Icon />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-strong group-hover:text-primary-hover">{line.name}</span>
                  <span className="text-small text-text-muted tabular-nums">{line.meta}</span>
                </span>
                {line.sum > 0 ? (
                  <span className="shrink-0 text-body-strong tabular-nums">{formatMoney(line.sum, country)}</span>
                ) : null}
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
              </Link>
            </li>
          );
        })}
      </ul>
      {more > 0 ? (
        <p className="mt-2 text-small text-text-muted">
          {fill(r.more, { count: more, rooms: plural(more, r.roomForms) })}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-3">
        {sum > 0 ? (
          <p className="flex items-center justify-between gap-3 rounded-lg bg-surface-mint px-4 py-3">
            <span className="text-body-strong">{r.total}</span>
            <span className="text-h3 font-extrabold tabular-nums">{formatMoney(sum, country)}</span>
          </p>
        ) : null}
        <Button asChild variant="accent" size="lg" className="w-full">
          <Link href={LIST_PATH}>
            {r.list}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        {estimate.rooms.length < ESTIMATE_LIMITS.rooms ? (
          <RoomEditor
            open={editing}
            onOpenChange={setEditing}
            room={null}
            {...(ceiling ? { draft: { heightMm: ceiling } } : {})}
            newName={newName}
            newType={newType}
            saveLabel={home.room.action}
            onSaved={setSavedId}
            trigger={
              <Button ref={addRef} variant="secondary" size="lg" className="w-full border-primary text-primary-hover">
                <Plus aria-hidden="true" />
                {r.add}
              </Button>
            }
          />
        ) : null}
        <SuggestionsSheet
          saved={saved ? { id: saved.id, name: saved.name, type: saved.type } : null}
          open={savedId !== undefined}
          onOpenChange={(next) => {
            if (!next) setSavedId(undefined);
          }}
          returnFocus={addRef}
          onAll={onAll}
        />
      </div>
    </>
  );
}
