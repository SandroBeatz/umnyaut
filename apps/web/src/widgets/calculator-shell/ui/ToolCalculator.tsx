"use client";

import type { ToolId } from "@umnyaut/calc";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { CalculatorShell, type CalculatorShellProps } from "./CalculatorShell";

export type ToolCalculatorProps = Omit<CalculatorShellProps, "module">;
type Props = Omit<CalculatorShellProps, "module">;

/** The shell bound to one calc module. */
const bind = ({ module }: { module: unknown }) =>
  function Bound(props: Props) {
    return <CalculatorShell {...props} module={module as CalculatorShellProps["module"]} />;
  };

/**
 * One chunk per calculator: a tool page loads only its own calc module (server-rendered and preloaded as before),
 * not all ten — the first-screen JS budget. Each `import()` is written out so the bundler can split and preload it.
 */
const shells: Record<ToolId, ComponentType<Props>> = {
  "ploshchad-komnaty": dynamic(() => import("@umnyaut/calc/modules/ploshchad-komnaty").then(bind)),
  "ploshchad-sten": dynamic(() => import("@umnyaut/calc/modules/ploshchad-sten").then(bind)),
  oboi: dynamic(() => import("@umnyaut/calc/modules/oboi").then(bind)),
  kraska: dynamic(() => import("@umnyaut/calc/modules/kraska").then(bind)),
  plintus: dynamic(() => import("@umnyaut/calc/modules/plintus").then(bind)),
  klej: dynamic(() => import("@umnyaut/calc/modules/klej").then(bind)),
  zatirka: dynamic(() => import("@umnyaut/calc/modules/zatirka").then(bind)),
  linoleum: dynamic(() => import("@umnyaut/calc/modules/linoleum").then(bind)),
  laminat: dynamic(() => import("@umnyaut/calc/modules/laminat").then(bind)),
  plitka: dynamic(() => import("@umnyaut/calc/modules/plitka").then(bind)),
};

export function ToolCalculator(props: ToolCalculatorProps) {
  const Shell = shells[props.tool.id];
  return <Shell {...props} />;
}
