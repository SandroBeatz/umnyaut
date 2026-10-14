"use client";

import {
  type EstimateCalc,
  type Surface,
  type ToolId,
  type ToolModule,
  type ToolResult,
  upgradeInput,
} from "@umnyaut/calc";
import { DEFAULT_COUNTRY, type ToolDef } from "@umnyaut/catalog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCountry } from "@/entities/country";
import { hydrateEstimate, lastOpened, selectActiveRoom, useEstimateStore } from "@/entities/estimate";
import type { ToolValues } from "@/entities/tool";
import { decodeShare } from "@/features/share-result";
import { readJson, writeStorage } from "@/shared/lib";
import { nextSurface, ownInput, surfaceInput, surfaceOf } from "./calcs";
import { applyRoom, isVisible, roomPatch, same } from "./fields";

/** Own input of a tool without purchases (area tools): they keep no calcs in the estimate. */
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
  /** The estimate's calc the calculator shows and writes to; none until the first own edit. */
  calcId: string | undefined;
  setValues(patch: ToolValues): void;
  setInvalid(name: string, invalid: boolean): void;
  /** Creates the active room from what the form shows, when there is none yet («В список» before any edit). */
  seedRoom(): void;
  /** The calc for the current values, created in the active room when there is none; its id. */
  ensureCalc(): string | undefined;
  /** «Добавить в список» — the only way a calc joins the estimate (owner, 2026-10-13). */
  addToEstimate(): void;
  /** «Обновить в списке»: the edits made since the calc joined the estimate replace what it counts. */
  updateEstimate(): void;
  /** Shows another calc of this tool in the room (a chip). */
  openCalc(id: string): void;
  /** «+ Ещё»: a new calc with default material on the first free surface. */
  addCalc(): void;
  setLabel(label: string): void;
  /** «Разделить»: the calc over two surfaces becomes one per surface, same input. */
  splitCalc(id: string, surfaces: readonly [Surface, Surface]): void;
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
 * State of one calculator (tech spec §6, spec «Несколько расчётов»). Render 1 = server render: defaults, RU. After
 * mount the input comes from `?s=` if present, otherwise from the last opened calc of this tool in the active room
 * over the room's sizes. Own edits are written to that calc (created on the first one; once it is in the estimate,
 * to its draft until «Обновить в списке»); room edits go to the room,
 * and room edits made elsewhere (the room row, the editor, another room chosen) flow into the fields.
 */
export function useCalculator(tool: ToolDef, module: ToolModule<ToolValues>): Calculator {
  const defaults = useMemo(() => module.defaults({ country: DEFAULT_COUNTRY }), [module]);
  const [values, setAll] = useState<ToolValues>(defaults);
  /** The values on screen, for the room and the calc written by an edit. */
  const shown = useRef(values);
  shown.current = values;
  const [calcId, setCalcIdState] = useState<string>();
  const current = useRef<string | undefined>(undefined);
  const setCalcId = useCallback((id: string | undefined) => {
    current.current = id;
    setCalcIdState(id);
  }, []);
  const [invalid, setInvalidSet] = useState<ReadonlySet<string>>(() => new Set());
  const [edits, setEdits] = useState(0);
  const changed = useRef(new Set<string>());
  const [fieldsChanged, setFieldsChanged] = useState(0);
  const country = useCountry();
  const loaded = useRef(false);
  /** Tools with purchases keep their input in the estimate's calcs; area tools do not. */
  const keepsCalcs = Boolean(tool.items);

  const parse = useCallback(
    (candidate: ToolValues): ToolValues | undefined => {
      const parsed = module.input.safeParse(candidate);
      return parsed.success ? parsed.data : undefined;
    },
    [module],
  );

  /** A calc's values in the active room: defaults → its input → the room. */
  const valuesOf = useCallback(
    (calc: EstimateCalc | undefined, base: ToolValues = defaults) => {
      // A calc in the estimate shows its unsaved edits, if any.
      const own = parse({ ...base, ...upgradeInput(module, calc?.draft ?? calc?.input ?? {}) }) ?? base;
      return parse(applyRoom(own, selectActiveRoom(useEstimateStore.getState()), tool.fields)) ?? own;
    },
    [defaults, module, parse, tool],
  );

  // Initial input after mount, by priority.
  useEffect(() => {
    const shared = decodeShare(new URLSearchParams(window.location.search).get("s"));
    const fromLink = shared && parse({ ...defaults, ...upgradeInput(module, shared) });
    if (fromLink) {
      setAll(fromLink);
      // The link wins over a stored room: its rehydrate must not pour the room into the link's sizes.
      void hydrateEstimate().then(() => {
        loaded.current = true;
      });
      return;
    }
    void hydrateEstimate().then(() => {
      const state = useEstimateStore.getState();
      const calc = keepsCalcs ? lastOpened(state.estimate, state.estimate?.activeRoomId, tool.id) : undefined;
      // No calc yet: what the tool kept before calcs existed (or an area tool's own values) is the start.
      const saved = calc ? undefined : readJson<ToolValues>(toolKey(tool.id));
      const base = (saved && parse({ ...defaults, ...upgradeInput(module, saved) })) ?? defaults;
      setAll(valuesOf(calc, base));
      setCalcId(calc?.id);
      if (calc) state.openCalc(calc.id);
      loaded.current = true;
    });
  }, [defaults, module, parse, tool, keepsCalcs, valuesOf, setCalcId]);

  // The estimate changed elsewhere: another room, the room's sizes, this calc removed, split or restored.
  useEffect(
    () =>
      useEstimateStore.subscribe((state, previous) => {
        if (!loaded.current) return;
        const room = selectActiveRoom(state);
        const before = selectActiveRoom(previous);
        const id = current.current;
        const calc = state.estimate?.calcs.find((c) => c.id === id);
        // A room created by the first edit is not another room: the values stay.
        const switched = before !== null && room?.id !== before.id;
        if (keepsCalcs && (switched || (id && !calc))) {
          // Another room, or the shown calc is gone: the last opened calc of this tool there, or a fresh start.
          const next = lastOpened(state.estimate, room?.id, tool.id);
          setCalcId(next?.id);
          setAll(valuesOf(next));
          return;
        }
        if (calc && !same(calc.draft ?? calc.input, ownInput(tool, shown.current, defaults))) {
          // The calc's own input changed outside the form («Разделить» set its surface).
          setAll(valuesOf(calc));
          return;
        }
        if (same(room, before)) return;
        setAll((now) => {
          const next = parse(applyRoom(now, room, tool.fields));
          return next && !same(next, now) ? next : now;
        });
      }),
    [parse, tool, defaults, keepsCalcs, valuesOf, setCalcId],
  );

  const seedRoom = useCallback(() => {
    const store = useEstimateStore.getState();
    if (selectActiveRoom(store) === null) store.patchActiveRoom(seen(tool, shown.current));
  }, [tool]);

  /** Writes the values' own input into the shown calc, creating it in the active room on the first own edit. */
  const writeCalc = useCallback(
    (next: ToolValues, create: boolean): string | undefined => {
      if (!keepsCalcs) return undefined;
      const store = useEstimateStore.getState();
      const surface = surfaceOf(tool, next);
      const fields = { input: ownInput(tool, next, defaults), toolVersion: module.version, surface };
      const id = current.current;
      const calc = store.estimate?.calcs.find((c) => c.id === id);
      if (id && calc?.addedAt !== undefined) {
        // In the estimate: the edits wait in the draft for «Обновить в списке»; back to what is saved — no draft.
        store.setDraft(id, same(fields.input, calc.input) ? undefined : fields.input);
        return id;
      }
      if (id && calc) {
        store.updateCalc(id, fields);
        return id;
      }
      if (!create) return undefined;
      seedRoom();
      const roomId = useEstimateStore.getState().estimate?.activeRoomId;
      if (!roomId) return undefined;
      const { surface: _, ...rest } = fields;
      const created = store.addCalc({ roomId, tool: tool.id, ...rest, ...(surface ? { surface } : {}) });
      setCalcId(created);
      return created;
    },
    [keepsCalcs, tool, defaults, module.version, seedRoom, setCalcId],
  );

  const setValues = useCallback(
    (patch: ToolValues) => {
      setEdits((n) => n + 1);
      for (const name of Object.keys(patch)) changed.current.add(name);
      setFieldsChanged(changed.current.size);
      const next = parse({ ...shown.current, ...patch }) ?? shown.current;
      setAll(next);
      shown.current = next;
      const room = roomPatch(patch, tool.fields);
      if (Object.keys(room).length > 0) {
        const store = useEstimateStore.getState();
        // The first edit creates the room from what the form shows, not from one field.
        store.patchActiveRoom({ ...(selectActiveRoom(store) === null ? seen(tool, next) : {}), ...room });
      }
      // An own field changed: it belongs to the calc. Nothing joins the estimate without «Добавить в список».
      if (Object.keys(patch).length > Object.keys(room).length) writeCalc(next, true);
    },
    [parse, tool, writeCalc],
  );

  const ensureCalc = useCallback(() => writeCalc(shown.current, true), [writeCalc]);

  const addToEstimate = useCallback(() => {
    const id = writeCalc(shown.current, true);
    if (id) useEstimateStore.getState().markAdded(id);
  }, [writeCalc]);

  const updateEstimate = useCallback(() => {
    const id = current.current;
    if (!id) return;
    useEstimateStore
      .getState()
      .commitDraft(id, { surface: surfaceOf(tool, shown.current), toolVersion: module.version });
  }, [tool, module.version]);

  const openCalc = useCallback(
    (id: string) => {
      const store = useEstimateStore.getState();
      const calc = store.estimate?.calcs.find((c) => c.id === id);
      if (!calc) return;
      setCalcId(id);
      setAll(valuesOf(calc));
      store.openCalc(id);
    },
    [valuesOf, setCalcId],
  );

  const addCalc = useCallback(() => {
    const store = useEstimateStore.getState();
    seedRoom();
    const roomId = useEstimateStore.getState().estimate?.activeRoomId;
    if (!roomId) return;
    const mine = store.estimate?.calcs.filter((c) => c.roomId === roomId && c.tool === tool.id) ?? [];
    const free = nextSurface(tool, mine);
    if (!free) return;
    const next = valuesOf(undefined, parse({ ...defaults, ...free }) ?? defaults);
    const surface = surfaceOf(tool, next);
    const id = store.addCalc({
      roomId,
      tool: tool.id,
      toolVersion: module.version,
      input: ownInput(tool, next, defaults),
      ...(surface ? { surface } : {}),
    });
    if (!id) return;
    setCalcId(id);
    setAll(next);
  }, [seedRoom, tool, valuesOf, parse, defaults, module.version, setCalcId]);

  const setLabel = useCallback(
    (label: string) => {
      const id = writeCalc(shown.current, true);
      if (id) useEstimateStore.getState().updateCalc(id, { label: label.slice(0, 40) || undefined });
    },
    [writeCalc],
  );

  const splitCalc = useCallback(
    (id: string, surfaces: readonly [Surface, Surface]) => {
      const store = useEstimateStore.getState();
      const calc = store.estimate?.calcs.find((c) => c.id === id);
      if (!calc) return;
      const copy = store.splitCalc(id, surfaces);
      if (!copy) return;
      const input = calc.draft ?? calc.input;
      store.updateCalc(id, { input: { ...input, ...surfaceInput(tool, surfaces[0]) } });
      store.updateCalc(copy, { input: { ...input, ...surfaceInput(tool, surfaces[1]) } });
      store.setDraft(id, undefined);
      store.setDraft(copy, undefined);
      if (current.current === id)
        setAll(valuesOf(useEstimateStore.getState().estimate?.calcs.find((c) => c.id === id)));
    },
    [tool, valuesOf],
  );

  // An area tool remembers its own (not room-bound) values that differ from defaults.
  useEffect(() => {
    if (edits === 0 || keepsCalcs) return;
    const own = ownInput(tool, values, defaults);
    writeStorage(toolKey(tool.id), Object.keys(own).length > 0 ? JSON.stringify(own) : null);
  }, [edits, values, defaults, tool, keepsCalcs]);

  /** `prefix.*` with `false` clears a whole group (openings rows shift after a removal). */
  const setInvalid = useCallback((name: string, flag: boolean) => {
    setInvalidSet((now) => {
      if (name.endsWith(".*")) {
        const prefix = name.slice(0, -1);
        const next = new Set([...now].filter((n) => !n.startsWith(prefix)));
        return next.size === now.size ? now : next;
      }
      if (now.has(name) === flag) return now;
      const next = new Set(now);
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
    calcId,
    setValues,
    setInvalid,
    seedRoom,
    ensureCalc,
    addToEstimate,
    updateEstimate,
    openCalc,
    addCalc,
    setLabel,
    splitCalc,
  };
}
