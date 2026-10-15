"use client";

import type { RoomType } from "@umnyaut/calc";
import { home, unitLabels } from "@umnyaut/catalog";
import { MaterialThumb } from "@umnyaut/ui";
import { formatDimensions, formatNumber, NBSP } from "@umnyaut/ui/format";
import { Package } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useCountry } from "@/entities/country";
import { freeRoomName, hydrateEstimate, selectActiveRoom, useEstimateStore } from "@/entities/estimate";
import { nameForType } from "@/features/edit-room";
import { materialImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import {
  DEFAULT_TYPE,
  type ExampleCard,
  type ExampleRoom,
  exampleRoom,
  isInitialExample,
  worksOf,
} from "../model/example";
import { hasCounted, type SavedRoomRef } from "../model/rooms";
import { type Part, RoomForm } from "./RoomForm";
import { RoomsList } from "./RoomsList";

const blueprint = {
  backgroundImage:
    "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  maskImage: "radial-gradient(ellipse 80% 70% at 30% 30%, #000 20%, transparent 75%)",
} as const;

const m = unitLabels.m;
const meters = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });
const photoOf = (key: string | undefined) =>
  key && key in materialImages ? materialImages[key as keyof typeof materialImages] : undefined;

export interface HomeRoomProps {
  /** Headline, lead and mascot: server-rendered, placed left of the card from 1024 px. */
  hero: ReactNode;
  /** Id of the categories section «Все расчёты» scrolls to. */
  categoriesId: string;
  /** Cards of the first state, computed on the server (`initialExample()`): hydration recomputes nothing. */
  initialCards: readonly ExampleCard[];
}

/**
 * First screen of the home page (`docs/ui/home-room-block.md`): the room block next to the hero and the example strip
 * «Для комнаты 12 м² нужно». The block asks «Какую комнату считаем?» until a calc is in the list, then shows «Ваш
 * ремонт». The server renders the 4 × 3 м example; the stored room replaces it after mount and every edit writes
 * back to the active room, so the tools open with the same sizes.
 */
export function HomeRoom({ hero, categoriesId, initialCards }: HomeRoomProps) {
  const estimate = useEstimateStore((s) => s.estimate);
  const stored = useEstimateStore(selectActiveRoom);
  const country = useCountry();
  const [ready, setReady] = useState(false);
  const [localType, setLocalType] = useState<RoomType>(DEFAULT_TYPE);
  const [saved, setSaved] = useState<SavedRoomRef | null>(null);

  useEffect(() => {
    let live = true;
    void hydrateEstimate().then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const view = ready && hasCounted(estimate) ? "list" : "form";
  const room = useMemo(() => exampleRoom(stored), [stored]);
  const type: RoomType = stored?.type ?? localType;
  const shownType = type === "other" ? undefined : type;

  // The server's cards stand for the first state; any other room loads the calculators and recomputes.
  const [cards, setCards] = useState<readonly ExampleCard[]>(initialCards);
  useEffect(() => {
    if (isInitialExample(room, type, country)) {
      setCards(initialCards);
      return;
    }
    let live = true;
    void import("../model/cards").then((m) => {
      if (live) setCards(m.exampleCards(room, worksOf(type), country));
    });
    return () => {
      live = false;
    };
  }, [room, type, country, initialCards]);

  /** Name for the type: «Кухня», «Кухня 2»; a name the user typed stays. */
  const nameOf = (next: RoomType, current: string) => {
    const rooms = useEstimateStore.getState().estimate?.rooms ?? [];
    const active = selectActiveRoom(useEstimateStore.getState());
    const others = rooms.filter((r) => r.id !== active?.id).map((r) => r.name);
    return nameForType(next, current, freeRoomName(rooms), others);
  };

  /** The active room takes the patch; with none, the shown room is saved whole (scenario 1: silently). */
  const writeActive = (patch: Partial<ExampleRoom> & { type?: RoomType; name?: string }) => {
    const store = useEstimateStore.getState();
    const active = selectActiveRoom(store);
    if (active) store.updateRoom(active.id, patch);
    else store.addRoom({ ...room, type: localType, name: nameOf(localType, ""), ...patch });
  };

  const size = (part: Part, mm: number) => writeActive({ [part]: mm });

  const pickType = (next: RoomType) => {
    setLocalType(next);
    // A stored room changes type at once; an example room keeps the type until the first size or the button.
    if (stored) writeActive({ type: next, name: nameOf(next, stored.name) });
  };

  const submit = () => {
    if (!stored) writeActive({});
    const active = selectActiveRoom(useEstimateStore.getState());
    if (active) setSaved({ id: active.id, name: active.name, type: active.type });
  };

  /** The editor needs a stored room: the example is saved as it is shown. */
  const ensureRoom = () => {
    if (!stored) writeActive({});
  };

  /** «Все расчёты»: on to the categories, focus with them. */
  const all = () => {
    const target = document.getElementById(categoriesId);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  };

  // `saved` follows the active room: a type changed after the button changes the suggestions too.
  const savedNow = saved && stored?.id === saved.id ? { id: stored.id, name: stored.name, type: stored.type } : saved;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60" style={blueprint} />
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-10 lg:px-8 lg:py-12">
          {hero}
          <div
            className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-4 shadow-md sm:p-6"
            data-home-room={view}
          >
            {view === "list" && estimate ? (
              <RoomsList estimate={estimate} country={country} onAll={all} />
            ) : (
              <RoomForm
                room={room}
                type={shownType}
                onSize={size}
                onType={pickType}
                onSubmit={submit}
                saved={savedNow}
                onAll={all}
                stored={stored}
                onEnsureRoom={ensureRoom}
              />
            )}
          </div>
        </div>
      </section>
      <ExampleStrip room={room} cards={cards} />
    </>
  );
}

function ExampleStrip({ room, cards }: { room: ExampleRoom; cards: readonly ExampleCard[] }) {
  const e = home.example;
  const area = (room.lengthMm / 1000) * (room.widthMm / 1000);
  const count = room.openings.reduce((sum, o) => sum + o.count, 0);
  const onlyDoor = count === 1 && room.openings.some((o) => o.type === "door" && o.count === 1);
  const parts = [
    fill(e.room, {
      dimensions: formatDimensions([room.lengthMm / 1000, room.widthMm / 1000], m),
      height: `${meters(room.heightMm)}${NBSP}${m}`,
    }),
    ...(count === 0 ? [] : [onlyDoor ? e.door : fill(e.openings, { count: formatNumber(count) })]),
  ];

  return (
    <section aria-labelledby="home-example" className="bg-surface-mint">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <h2 id="home-example" className="text-h2">
          {fill(e.title, { area: `${formatNumber(area, { maxFraction: 1 })}${NBSP}${unitLabels.m2}` })}
        </h2>
        <p className="mt-1 text-small text-text-muted">
          {parts.join(", ")}. {e.retype}
        </p>
        {cards.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border-input border-dashed bg-surface p-4 text-small text-text-muted">
            {e.empty}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => (
              <li key={card.key}>
                <Link
                  href={card.href}
                  aria-label={`${card.title}: ${card.quantity}. ${fill(e.open, { title: card.toolTitle })}`}
                  className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm transition-colors hover:border-border-input sm:flex-row sm:items-center sm:p-4"
                >
                  <MaterialThumb image={photoOf(card.photo)} fallbackIcon={<Package />} alt="" size={64} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-strong text-text group-hover:text-primary-hover">{card.title}</span>
                    <span className="text-small text-text-muted">{card.pack}</span>
                    <span className="mt-1 text-h3 tabular-nums">{card.quantity}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
