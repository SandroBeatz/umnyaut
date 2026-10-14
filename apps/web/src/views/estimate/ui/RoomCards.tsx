"use client";

import type { EstimateRoom } from "@umnyaut/calc";
import { estimatePage, shell, toolPath } from "@umnyaut/catalog";
import { Button, categoryIcons, toast } from "@umnyaut/ui";
import { type Country, formatMoney } from "@umnyaut/ui/format";
import { Calculator, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { freeRoomName, useEstimateStore } from "@/entities/estimate";
import { RoomEditor } from "@/features/edit-room";
import { fill } from "@/shared/lib";
import { Hint } from "@/shared/ui";
import type { CalcRow, EstimateBoard, RoomCard } from "../model/board";

const t = estimatePage;

/** Opens a calc in its calculator: its room becomes the active one and the calc the last opened (scenario 4). */
const openCalc = (row: CalcRow) => {
  const store = useEstimateStore.getState();
  store.setActiveRoom(row.roomId);
  store.openCalc(row.id);
};

const rowClass = "group flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-2 text-text lg:gap-4";

const NO_ROOMS: readonly EstimateRoom[] = [];

const removeCalc = (id: string) => {
  useEstimateStore.getState().removeCalc(id);
  toast(t.removed, { action: { label: shell.calcs.undo, onClick: () => useEstimateStore.getState().undoRemove() } });
};

/** The room editor behind a trigger; `room: null` adds a room. */
function EditRoom({ room, trigger }: { room: EstimateRoom | null; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rooms = useEstimateStore((s) => s.estimate?.rooms ?? NO_ROOMS);
  return <RoomEditor open={open} onOpenChange={setOpen} room={room} newName={freeRoomName(rooms)} trigger={trigger} />;
}

function RoomTitle({ room, size, readOnly }: { room: EstimateRoom; size?: string; readOnly?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="flex items-center gap-2">
        <h2 className="min-w-0 truncate text-h3">{room.name}</h2>
        {readOnly ? null : (
          <EditRoom
            room={room}
            trigger={
              // A 32 px button beside the name; the tap area is 48 px all the same (`after:` widens it unseen).
              <button
                type="button"
                className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors after:absolute after:-inset-2 hover:bg-primary-soft hover:text-primary-hover print:hidden"
                aria-label={fill(t.editRoom, { room: room.name })}
              >
                <Pencil aria-hidden="true" className="size-4" />
              </button>
            }
          />
        )}
      </span>
      {size ? <span className="text-small text-text-muted tabular-nums">{size}</span> : null}
    </span>
  );
}

/**
 * One calc row: the link into its calculator and a red trash. The trash asks in the row itself — «Убрать «Краска» из
 * сметы?» with «Убрать» and «Отмена» — then «Вернуть» in a toast.
 */
function CalcRowItem({ row, content, readOnly }: { row: CalcRow; content: ReactNode; readOnly?: boolean | undefined }) {
  const [asking, setAsking] = useState(false);
  if (asking) {
    return (
      <li
        className="flex min-h-[72px] flex-wrap items-center gap-x-3 gap-y-2 border-border border-t py-2"
        data-calc-row
      >
        <p className="min-w-0 flex-1 text-body-strong">{fill(t.removeConfirm, { calc: row.title })}</p>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={() => removeCalc(row.id)}>
            {t.removeYes}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAsking(false)}>
            {t.removeNo}
          </Button>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-center border-border border-t" data-calc-row>
      {readOnly ? (
        <div className={rowClass}>{content}</div>
      ) : (
        <Link href={toolPath(row.tool)} onClick={() => openCalc(row)} className={rowClass}>
          {content}
        </Link>
      )}
      {readOnly ? null : (
        <button
          type="button"
          className="flex size-12 shrink-0 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger-soft print:hidden"
          aria-label={fill(t.remove, { calc: row.title })}
          onClick={() => setAsking(true)}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      )}
    </li>
  );
}

/** A room with its calcs; each row leads back to the calculator with this room and this calc. */
export function RoomCardView({ card, country, readOnly }: { card: RoomCard; country: Country; readOnly?: boolean }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface px-4 pt-4 pb-2 shadow-sm lg:px-6 lg:pt-5 print:break-inside-avoid print:shadow-none"
      data-room-card={card.room.name}
    >
      <header className="flex items-center gap-3 pb-3">
        <RoomTitle room={card.room} readOnly={readOnly} {...(card.size ? { size: card.size } : {})} />
        {card.sum > 0 ? (
          <span className="text-h3 font-extrabold tabular-nums">{formatMoney(card.sum, country)}</span>
        ) : null}
      </header>
      <ul>
        {card.rows.map((row) => {
          const Icon = categoryIcons[row.tool.category as keyof typeof categoryIcons] ?? Calculator;
          const content = (
            <>
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-mint text-primary-hover [&_svg]:size-6"
              >
                <Icon />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-strong group-hover:text-primary-hover">{row.title}</span>
                {row.caption ? <span className="text-small text-text-muted">{row.caption}</span> : null}
              </span>
              <span className="flex shrink-0 flex-col items-end tabular-nums sm:flex-row sm:items-center sm:gap-6">
                {row.quantity ? <span className="text-body-strong">{row.quantity}</span> : null}
                {row.cost !== undefined ? (
                  <span className="text-small text-text-muted sm:min-w-24 sm:text-right sm:text-body sm:text-text">
                    {formatMoney(row.cost, country)}
                  </span>
                ) : null}
              </span>
              {readOnly ? null : (
                <ChevronRight
                  aria-hidden="true"
                  className="hidden size-5 shrink-0 text-primary sm:block print:hidden"
                />
              )}
            </>
          );
          return <CalcRowItem key={row.id} row={row} content={content} readOnly={readOnly} />;
        })}
      </ul>
    </section>
  );
}

/** «Общие расходники»: every room's consumables bought once, with the saving. */
export function SharedCard({ board, country }: { board: EstimateBoard; country: Country }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface px-4 pt-4 pb-2 shadow-sm lg:px-6 lg:pt-5 print:break-inside-avoid print:shadow-none"
      data-shared-card
    >
      <header className="flex items-center gap-3 pb-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-h3">{t.shared.title}</h2>
          <span className="text-small text-text-muted">{t.shared.lead}</span>
        </span>
        {board.sharedSum > 0 ? (
          <span className="text-h3 font-extrabold tabular-nums">{formatMoney(board.sharedSum, country)}</span>
        ) : null}
      </header>
      {board.saving ? <Hint className="mb-3">{board.saving}</Hint> : null}
      <ul>
        {board.shared.map((row) => (
          <li key={row.key} className="flex min-h-16 items-center gap-3 border-border border-t py-2" data-shared-row>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body-strong">{row.title}</span>
              <span className="text-small text-text-muted">{row.from}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end tabular-nums">
              <span className="text-body-strong">{row.quantity}</span>
              {row.detail ? <span className="text-small text-text-muted">{row.detail}</span> : null}
              {row.cost !== undefined ? (
                <span className="text-small text-text-muted">{formatMoney(row.cost, country)}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A room with nothing counted yet: the usual works of its type, one tap into the calculator with this room. */
export function EmptyRoomCard({ card, readOnly }: { card: RoomCard; readOnly?: boolean }) {
  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-border-input border-dashed px-4 py-4 lg:px-6 print:hidden"
      data-empty-room={card.room.name}
    >
      <RoomTitle
        room={card.room}
        readOnly={readOnly}
        size={card.size ? `${card.size} · ${t.emptyRoom}` : t.emptyRoom.charAt(0).toUpperCase() + t.emptyRoom.slice(1)}
      />
      {!readOnly && card.suggestions.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {card.suggestions.map((tool) => (
            <li key={tool.id}>
              <Link
                href={toolPath(tool)}
                onClick={() => useEstimateStore.getState().setActiveRoom(card.room.id)}
                aria-label={fill(t.suggestLabel, { tool: tool.title.toLowerCase(), room: card.room.name })}
                className="flex min-h-12 items-center rounded-md bg-primary-soft px-4 text-small font-semibold text-primary-hover hover:bg-surface-mint"
              >
                {fill(t.suggest, { tool: tool.title })}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** «+ Комната»: the room editor for a new room. */
export function AddRoom() {
  return (
    <EditRoom
      room={null}
      trigger={
        <Button variant="ghost" size="md" className="self-start px-3 print:hidden">
          <Plus aria-hidden="true" />
          {t.addRoom}
        </Button>
      }
    />
  );
}
