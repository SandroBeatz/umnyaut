"use client";

import { home, shell, unitLabels } from "@umnyaut/catalog";
import { Button, MaterialThumb, NumberField, ToggleChips } from "@umnyaut/ui";
import { formatDimensions, formatNumber, NBSP } from "@umnyaut/ui/format";
import { ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useCountry } from "@/entities/country";
import { hydrateEstimate, useActiveRoom, useEstimateStore } from "@/entities/estimate";
import { type RoomDraft, RoomScheme } from "@/entities/room";
import { materialImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { defaultWorks, type ExampleCard, exampleRoom, isInitialExample } from "../model/example";

const t = home.room;
const m = unitLabels.m;
const LIMITS = { lengthMm: [300, 100_000], widthMm: [300, 100_000], heightMm: [1000, 10_000] } as const;
type Part = keyof typeof LIMITS;
const PARTS: readonly (readonly [Part, string])[] = [
  ["lengthMm", t.length],
  ["widthMm", t.width],
  ["heightMm", t.height],
];

const blueprint = {
  backgroundImage:
    "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  maskImage: "radial-gradient(ellipse 80% 70% at 30% 30%, #000 20%, transparent 75%)",
} as const;

const meters = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });
const range = ([min, max]: readonly [number, number]) =>
  fill(shell.form.range, { min: formatNumber(min / 1000), max: formatNumber(max / 1000), unit: m });
const photoOf = (key: string | undefined) =>
  key && key in materialImages ? materialImages[key as keyof typeof materialImages] : undefined;

export interface HomeRoomProps {
  /** Headline, lead and mascot: server-rendered, placed left of the card from 1024 px. */
  hero: ReactNode;
  /** Id of the categories section the orange button scrolls to. */
  categoriesId: string;
  /** Cards of the first state, computed on the server (`initialExample()`): hydration recomputes nothing. */
  initialCards: readonly ExampleCard[];
}

/**
 * First screen of the home page: “My room” card next to the hero and the example strip «Для комнаты 12 м²
 * нужно». The server renders the 4 × 3 м example; the stored room replaces it after mount and every edit
 * writes back to “My room”, so the tools open with the same dimensions.
 */
export function HomeRoom({ hero, categoriesId, initialCards }: HomeRoomProps) {
  const stored = useActiveRoom();
  const country = useCountry();
  const [works, setWorks] = useState<string[]>(defaultWorks);

  useEffect(() => {
    void hydrateEstimate();
  }, []);

  const room = useMemo(() => exampleRoom(stored), [stored]);
  // The server's cards stand for the first state; any other room loads the calculators and recomputes.
  const [cards, setCards] = useState<readonly ExampleCard[]>(initialCards);
  useEffect(() => {
    if (isInitialExample(room, works, country)) {
      setCards(initialCards);
      return;
    }
    let live = true;
    void import("../model/cards").then((m) => {
      if (live) setCards(m.exampleCards(room, works, country));
    });
    return () => {
      live = false;
    };
  }, [room, works, country, initialCards]);

  const change = (part: Part, value: number | null) => {
    if (value === null) return;
    const mm = Math.round(value * 1000);
    if (mm < LIMITS[part][0] || mm > LIMITS[part][1]) return;
    useEstimateStore.getState().patchActiveRoom({ [part]: mm } satisfies RoomDraft);
  };

  /** Keeps the shown room (the example too) as “My room” and goes on to the categories. */
  const choose = () => {
    useEstimateStore.getState().patchActiveRoom(room);
    const target = document.getElementById(categoriesId);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  };

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60" style={blueprint} />
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-10 lg:px-8 lg:py-12">
          {hero}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-md sm:p-6">
            <h2 className="text-h3">{t.title}</h2>
            <p className="mt-1 text-small text-text-muted">{t.note}</p>
            <RoomScheme
              lengthMm={room.lengthMm}
              widthMm={room.widthMm}
              heightMm={room.heightMm}
              unit={m}
              label={fill(t.scheme, {
                length: meters(room.lengthMm),
                width: meters(room.widthMm),
                height: meters(room.heightMm),
              })}
              className="mx-auto mt-2 h-auto w-full max-w-[320px]"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PARTS.map(([part, label]) => (
                <NumberField
                  key={part}
                  label={label}
                  unit={m}
                  value={room[part] / 1000}
                  onValueChange={(value) => change(part, value)}
                  min={LIMITS[part][0] / 1000}
                  max={LIMITS[part][1] / 1000}
                  messages={{ range: range(LIMITS[part]) }}
                />
              ))}
            </div>
            <p className="mt-4 text-small font-medium text-text">{t.works}</p>
            <ToggleChips
              chips={home.works.map((w) => ({ value: w.id, label: w.label }))}
              value={works}
              onValueChange={setWorks}
              label={t.works}
              className="mt-2"
            />
            <Button variant="accent" size="lg" className="mt-5 w-full" onClick={choose}>
              {t.action}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
      <ExampleStrip room={room} cards={cards} />
    </>
  );
}

function ExampleStrip({ room, cards }: { room: ReturnType<typeof exampleRoom>; cards: readonly ExampleCard[] }) {
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
