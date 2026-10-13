"use client";

import type { ToolId, ToolModule, ToolResult } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, type ToolDef } from "@umnyaut/catalog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCountry } from "@/entities/country";
import { hydrateEstimate, selectActiveRoom, useEstimateStore } from "@/entities/estimate";
import type { ToolValues } from "@/entities/tool";
import { decodeShare } from "@/features/share-result";
import { readJson, writeStorage } from "@/shared/lib";
import { applyRoom, isVisible, roomBindings, roomPatch, same } from "./fields";

const toolKey = (id: ToolId) => `umnyaut:tool:${id}:v1`;

export interface Calculator {
  values: ToolValues;
  defaults: ToolValues;
  result: ToolResult;
  /** A field is invalid: the result is the last valid one («по прошлым значениям»). */
  stale: boolean;
  /** Untouched defaults: the mascot says «Это пример». */
  example: boolean;
  /** Field changes by the user since load. */
  edits: number;
  /** Distinct fields the user changed since load (for `calc_completed`). */
  fieldsChanged: number;
  setValues(patch: ToolValues): void;
  /** Creates the active room from what the form shows, when there is none yet («В список» before any edit). */
  seedRoom(): void;
  setInvalid(name: string, invalid: boolean): void;
}

/**
 * The room a tool's form shows: sizes and shape of the visible fields (the wall height of floor tile is hidden, so
 * not taken). The tool's doors and windows are an example: they reach the room only when the user changes them.
 */
function seen(tool: ToolDef, values: ToolValues) {
  const { openings: _, ...room } = roomPatch(
    values,
    tool.fields.filter((f) => isVisible(f, values)),
  );
  return room;
}

/**
 * State of one calculator (tech spec §6). Render 1 = server render: defaults, RU. After mount the input comes
 * from `?s=` if present, otherwise from “My room” over the tool's saved values. Field edits write bound parts
 * back to the room; room edits made elsewhere (RoomBar) flow into the fields.
 */
export function useCalculator(tool: ToolDef, module: ToolModule<ToolValues>): Calculator {
  const defaults = useMemo(() => module.defaults({ country: DEFAULT_COUNTRY }), [module]);
  const [values, setAll] = useState<ToolValues>(defaults);
  /** The values on screen, for the room created by the first edit. */
  const shown = useRef(values);
  shown.current = values;
  const [invalid, setInvalidSet] = useState<ReadonlySet<string>>(() => new Set());
  const [edits, setEdits] = useState(0);
  const changed = useRef(new Set<string>());
  const [fieldsChanged, setFieldsChanged] = useState(0);
  const country = useCountry();
  const loaded = useRef(false);

  const parse = useCallback(
    (candidate: ToolValues): ToolValues | undefined => {
      const parsed = module.input.safeParse(candidate);
      return parsed.success ? parsed.data : undefined;
    },
    [module],
  );

  // Initial input after mount, by priority.
  useEffect(() => {
    const shared = decodeShare(new URLSearchParams(window.location.search).get("s"));
    const fromLink = shared && parse({ ...defaults, ...shared });
    if (fromLink) {
      setAll(fromLink);
      loaded.current = true;
      void hydrateEstimate();
      return;
    }
    const saved = readJson<ToolValues>(toolKey(tool.id));
    const base = (saved && parse({ ...defaults, ...saved })) ?? defaults;
    void hydrateEstimate().then(() => {
      const withRoom = parse(applyRoom(base, selectActiveRoom(useEstimateStore.getState()), tool.fields));
      setAll(withRoom ?? base);
      loaded.current = true;
    });
  }, [defaults, parse, tool]);

  // Room edits from RoomBar or another tab.
  useEffect(
    () =>
      useEstimateStore.subscribe((state, previous) => {
        const room = selectActiveRoom(state);
        const before = selectActiveRoom(previous);
        if (!loaded.current || same(room, before)) return;
        // Another room is chosen: what it does not know yet comes from the defaults, not from the last room.
        const switched = before !== null && room?.id !== before.id;
        const bound = switched
          ? Object.fromEntries(roomBindings(tool.fields).map(([name]) => [name, defaults[name]]))
          : {};
        setAll((current) => {
          const next = parse(applyRoom({ ...current, ...bound }, room, tool.fields));
          return next && !same(next, current) ? next : current;
        });
      }),
    [parse, tool, defaults],
  );

  const setValues = useCallback(
    (patch: ToolValues) => {
      setEdits((n) => n + 1);
      for (const name of Object.keys(patch)) changed.current.add(name);
      setFieldsChanged(changed.current.size);
      setAll((current) => parse({ ...current, ...patch }) ?? current);
      const room = roomPatch(patch, tool.fields);
      if (Object.keys(room).length === 0) return;
      const store = useEstimateStore.getState();
      // The first edit creates the room from what the form shows, not from one field.
      store.patchActiveRoom({ ...(selectActiveRoom(store) === null ? seen(tool, shown.current) : {}), ...room });
    },
    [parse, tool],
  );

  const seedRoom = useCallback(() => {
    const store = useEstimateStore.getState();
    if (selectActiveRoom(store) === null) store.patchActiveRoom(seen(tool, shown.current));
  }, [tool]);

  // Remember the tool's own (not room-bound) values that differ from defaults.
  useEffect(() => {
    if (edits === 0) return;
    const bound = new Set(roomBindings(tool.fields).map(([name]) => name));
    const own = Object.entries(values).filter(([k, v]) => !bound.has(k) && !same(v, defaults[k]));
    writeStorage(toolKey(tool.id), own.length > 0 ? JSON.stringify(Object.fromEntries(own)) : null);
  }, [edits, values, defaults, tool]);

  /** `prefix.*` with `false` clears a whole group (openings rows shift after a removal). */
  const setInvalid = useCallback((name: string, flag: boolean) => {
    setInvalidSet((current) => {
      if (name.endsWith(".*")) {
        const prefix = name.slice(0, -1);
        const next = new Set([...current].filter((n) => !n.startsWith(prefix)));
        return next.size === current.size ? current : next;
      }
      if (current.has(name) === flag) return current;
      const next = new Set(current);
      if (flag) next.add(name);
      else next.delete(name);
      return next;
    });
  }, []);

  // An error in a field hidden by `when` (cut-out of a rectangle) does not hold the result back.
  const stale = [...invalid].some((name) => {
    const field = tool.fields.find((f) => "name" in f && f.name === name.split(".")[0]);
    return !field || isVisible(field, values);
  });

  const result = useMemo(() => module.compute(values, { country }), [module, values, country]);

  return {
    values,
    defaults,
    result,
    stale,
    example: edits === 0 && same(values, defaults),
    edits,
    fieldsChanged,
    setValues,
    setInvalid,
    seedRoom,
  };
}
