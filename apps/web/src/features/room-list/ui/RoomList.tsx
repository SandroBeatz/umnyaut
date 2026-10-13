"use client";

import type { ToolId, ToolModule } from "@umnyaut/calc";
import { shell, toolPath } from "@umnyaut/catalog";
import { categoryIcons, MaterialThumb, toast } from "@umnyaut/ui";
import { Calculator, Copy, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hydrateEstimate, useActiveCalcs, useActiveRoom, useEstimateStore } from "@/entities/estimate";
import { groupPurchases, loadToolModule, purchaseTexts, ToolCard, type ToolValues } from "@/entities/tool";
import { materialImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { Hint } from "@/shared/ui";
import { buildList, type ListEntry } from "../model/build";
import { itemDef } from "../model/input";

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
    void hydrateEstimate().then(() => setReady(true));
  }, []);
  const calcs = useActiveCalcs();
  const entries = useMemo(
    () => calcs.map((c): ListEntry => ({ id: c.id, tool: c.tool as ToolId, input: c.input })),
    [calcs],
  );
  const removeToolCalcs = useEstimateStore((s) => s.removeToolCalcs);
  const remove = (id: string) => {
    useEstimateStore.getState().removeCalc(id);
    toast(shell.calcs.removed, {
      action: { label: shell.calcs.undo, onClick: () => useEstimateStore.getState().undoRemove() },
    });
  };
  const clear = () => removeToolCalcs();
  const room = useActiveRoom();
  // Each work's calculator is loaded when the list needs it, not with the page.
  const [modules, setModules] = useState<ReadonlyMap<ToolId, ToolModule<ToolValues>>>(() => new Map());
  useEffect(() => {
    const missing = [...new Set(entries.map((e) => e.tool))].filter((id) => !modules.has(id));
    if (missing.length === 0) return;
    let live = true;
    void Promise.all(missing.map(async (id) => [id, await loadToolModule(id)] as const)).then((loaded) => {
      if (live) setModules((known) => new Map([...known, ...loaded]));
    });
    return () => {
      live = false;
    };
  }, [entries, modules]);
  if (!ready || entries.length === 0 || entries.some((e) => !modules.has(e.tool))) return null;

  const view = buildList(entries, room, (id) => modules.get(id));
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
        {view.works.map(({ id, tool }) => {
          const Icon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
          return (
            <li key={id} className="flex items-center rounded-full border border-border bg-surface-sunken">
              <Link href={toolPath(tool)} className="flex min-h-12 items-center gap-2 pl-4 text-body text-text">
                <Icon aria-hidden="true" className="size-5 text-primary" />
                {tool.title}
              </Link>
              <button
                type="button"
                className="flex size-12 items-center justify-center rounded-full text-text-muted hover:text-danger"
                aria-label={fill(t.remove, { tool: tool.title })}
                onClick={() => remove(id)}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>

      {view.conflicts.map((code) => (
        <Hint key={code} className="mt-3">
          {t.conflicts[code]}
        </Hint>
      ))}

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
