/**
 * Tiles in a grid (tile, later wall panels). Along one span: whole tiles with joints between them, laid from a
 * wall («от угла») or symmetric about the middle («от центра»: a joint or a tile in the middle, whichever leaves
 * the wider edge cut). Tiles sit against the wall; the remainder is cut. Each cut piece takes one tile
 * (Kerama Marazzi: from the centre the cuts fall on both edges and take two tiles instead of one).
 */
export interface GridLine {
  whole: number;
  /** Widths of the cut pieces at the ends, mm: none, one (corner) or two equal ones (centre). */
  cuts: number[];
}

export function gridLine(spanMm: number, tileMm: number, jointMm: number, start: "corner" | "center"): GridLine {
  const pitch = tileMm + jointMm;
  if (spanMm < tileMm) return { whole: 0, cuts: spanMm > 0 ? [spanMm] : [] };
  if (start === "corner") {
    const whole = Math.floor((spanMm + jointMm) / pitch);
    const rest = spanMm - whole * pitch;
    return { whole, cuts: rest > 0 ? [rest] : [] };
  }
  // Centre: n whole tiles in the middle, a joint and an equal cut at each end.
  const edge = (n: number) => (spanMm - n * tileMm - (n + 1) * jointMm) / 2;
  const options = [0, 1].map((parity) => {
    let n = Math.floor((spanMm + jointMm) / pitch);
    if (n % 2 !== parity) n--;
    while (n > 0 && edge(n) < 0) n -= 2;
    return n >= parity ? { n, e: edge(n) } : undefined;
  });
  const exact = Math.floor((spanMm + jointMm) / pitch);
  // Whole tiles that fill the span exactly need no cuts at all.
  if (exact * tileMm + (exact - 1) * jointMm === spanMm) return { whole: exact, cuts: [] };
  const best = options
    .filter((o): o is { n: number; e: number } => o !== undefined && o.e > 0)
    .sort((a, b) => b.e - a.e || b.n - a.n)[0];
  return best ? { whole: best.n, cuts: [best.e, best.e] } : { whole: exact, cuts: [] };
}

export interface GridArea {
  whole: number;
  /** Cut pieces, each from its own tile. */
  cut: number;
  /** Narrowest cut piece, mm (0 when nothing is cut). */
  narrowestMm: number;
}

/** A rectangle: whole = whole × whole; cut = the edge strips and the corners. */
export function gridArea(
  widthMm: number,
  heightMm: number,
  tileWidthMm: number,
  tileHeightMm: number,
  jointMm: number,
  start: "corner" | "center",
): GridArea {
  const x = gridLine(widthMm, tileWidthMm, jointMm, start);
  const y = gridLine(heightMm, tileHeightMm, jointMm, start);
  const cut = x.whole * y.cuts.length + y.whole * x.cuts.length + x.cuts.length * y.cuts.length;
  const narrowest = Math.min(Number.POSITIVE_INFINITY, ...x.cuts, ...y.cuts);
  return { whole: x.whole * y.whole, cut, narrowestMm: Number.isFinite(narrowest) ? narrowest : 0 };
}
