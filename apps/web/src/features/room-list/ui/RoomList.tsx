"use client";

import { shell, toolPath } from "@umnyaut/catalog";
import { categoryIcons, MaterialThumb, toast } from "@umnyaut/ui";
import { Calculator, Copy, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoomStore } from "@/entities/room";
import { groupPurchases, purchaseTexts, ToolCard } from "@/entities/tool";
import { materialImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { buildList, itemDef } from "../model/build";
import { hydrateList, useListStore } from "../model/store";

const t = shell.roomList;

const photoOf = (key: string | undefined) =>
  key && key in materialImages ? materialImages[key as keyof typeof materialImages] : undefined;

/**
 * «Список для комнаты» (P6.11): every added work recomputed with the current “My room”, items merged by
 * `mergeItems()`, the next purchase tools of the same categories. Local only; nothing renders until the
 * stored list is read after mount, so the server HTML has no list.
 */
export function RoomList() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void hydrateList().then(() => setReady(true));
  }, []);
  const entries = useListStore((s) => s.entries);
  const remove = useListStore((s) => s.remove);
  const clear = useListStore((s) => s.clear);
  const room = useRoomStore((s) => s.room);
  if (!ready || entries.length === 0) return null;

  const view = buildList(entries, room);
  const lines = groupPurchases(view.items).map((group) => {
    const def = itemDef(group.first.key);
    return { key: group.first.key, title: def?.title ?? group.first.key, photo: def?.photo, ...purchaseTexts(group) };
  });
  const text = [t.title, ...lines.map((l) => `${l.title}: ${l.quantity}${l.detail ? ` (${l.detail})` : ""}`)].join(
    "\n",
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t.copied);
    } catch {
      toast.error(shell.actions.copyFailed);
    }
  };

  return (
    <section
      aria-labelledby="room-list"
      className="rounded-lg border border-border bg-surface p-4 shadow-sm print:hidden lg:p-6"
      data-room-list
    >
      <h2 id="room-list" className="text-h3">
        {t.title}
      </h2>
      <p className="mt-1 text-small text-text-muted">{t.lead}</p>

      <h3 className="mt-4 text-small font-semibold text-text-muted">{t.works}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {view.works.map(({ tool }) => {
          const Icon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
          return (
            <li key={tool.id} className="flex items-center rounded-full border border-border bg-surface-sunken">
              <Link href={toolPath(tool)} className="flex min-h-12 items-center gap-2 pl-4 text-body text-text">
                <Icon aria-hidden="true" className="size-5 text-primary" />
                {tool.title}
              </Link>
              <button
                type="button"
                className="flex size-12 items-center justify-center rounded-full text-text-muted hover:text-danger"
                aria-label={fill(t.remove, { tool: tool.title })}
                onClick={() => remove(tool.id)}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-4 text-small font-semibold text-text-muted">{t.buy}</h3>
      <ul className="mt-1 divide-y divide-border">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center gap-3 py-2">
            <MaterialThumb image={photoOf(line.photo)} fallbackIcon={<Calculator />} alt="" size={56} />
            <span className="flex flex-1 flex-col">
              <span className="text-body">{line.title}</span>
              {line.detail ? <span className="text-small text-text-muted tabular-nums">{line.detail}</span> : null}
            </span>
            <span className="text-quantity tabular-nums" data-list-quantity>
              {line.quantity}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex min-h-12 items-center gap-2 rounded-md px-3 text-body text-primary hover:bg-primary-soft"
        >
          <Copy aria-hidden="true" className="size-5" />
          {t.copy}
        </button>
        <button
          type="button"
          onClick={clear}
          className="flex min-h-12 items-center gap-2 rounded-md px-3 text-body text-text-muted hover:text-danger"
        >
          <Trash2 aria-hidden="true" className="size-5" />
          {t.clear}
        </button>
      </div>

      {view.next.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-small font-semibold text-text-muted">{t.next}</h3>
          <ul className="mt-2 grid gap-3 sm:grid-cols-2">
            {view.next.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
