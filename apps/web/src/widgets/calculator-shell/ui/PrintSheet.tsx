"use client";

import type { PurchaseItem } from "@umnyaut/calc";
import { packNouns, shell, type ToolDef, unitLabels } from "@umnyaut/catalog";
import { Logo } from "@umnyaut/ui";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { useEffect, useState } from "react";
import type { ResultView } from "../model/view";

const p = shell.print;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export interface PrintSheetProps {
  tool: ToolDef;
  view: ResultView;
  items: readonly PurchaseItem[];
  room?: string;
  getUrl(): string;
}

const packText = (item: PurchaseItem) =>
  `${packNouns[item.pack.kind][0]} ${formatNumber(item.pack.size.value)}${NBSP}${unitLabels[item.pack.size.unit]}`;

/**
 * A4 black-and-white list (design spec §14): logo and date, a table with an empty box per row to tick with a pen,
 * room size, date and link at the bottom. Hidden on screen. Date and link are filled in the browser.
 */
export function PrintSheet({ tool, view, items, room, getUrl }: PrintSheetProps) {
  const [stamp, setStamp] = useState<{ date: string; url: string }>();
  useEffect(() => {
    const update = () => setStamp({ date: dateFormat.format(new Date()), url: getUrl() });
    update();
    window.addEventListener("beforeprint", update);
    return () => window.removeEventListener("beforeprint", update);
  }, [getUrl]);

  const cell = "border border-black px-2 py-1 text-left align-top";
  return (
    <div className="hidden text-[12pt] text-black print:block">
      <div className="flex items-center justify-between">
        <Logo />
        <span>{stamp?.date}</span>
      </div>
      <h2 className="mt-4 text-[16pt] font-bold">
        {tool.title}
        {view.mode === "buy" ? ` — ${p.heading}` : ""}
      </h2>
      <table className="mt-3 w-full border-collapse">
        {view.mode === "buy" ? (
          <>
            <thead>
              <tr>
                <th className={`${cell} w-8`} aria-label="✓" />
                <th className={cell}>{p.item}</th>
                <th className={cell}>{p.pack}</th>
                <th className={cell}>{p.quantity}</th>
                <th className={cell}>{p.price}</th>
                <th className={cell}>{p.sum}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td className={cell}>☐</td>
                  <td className={cell}>{tool.items?.[item.key]?.title ?? item.key}</td>
                  <td className={cell}>{packText(item)}</td>
                  <td className={cell}>{formatNumber(item.packs)}</td>
                  <td className={cell} />
                  <td className={cell} />
                </tr>
              ))}
            </tbody>
          </>
        ) : (
          <tbody>
            {[
              ...(view.main
                ? [{ key: view.main.key, label: view.main.title, value: `${view.main.value}${NBSP}${view.main.unit}` }]
                : []),
              ...view.tiles,
            ].map((row) => (
              <tr key={row.key}>
                <th className={cell}>{row.label}</th>
                <td className={cell}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {view.total ? <p className="mt-2 font-semibold">{view.total.text}</p> : null}
      <p className="mt-4">
        {room ? `${p.room}: ${room}. ` : ""}
        {stamp ? `${p.date}: ${stamp.date}` : ""}
      </p>
      {stamp ? (
        <p className="break-all">
          {p.link}: {stamp.url}
        </p>
      ) : null}
    </div>
  );
}
