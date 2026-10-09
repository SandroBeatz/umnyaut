import { describe, expect, it } from "vitest";
import { cutStrips } from "./strips";

const base = { rollLengthMm: 10_050, repeatMm: 0, offset: false, stripLengthMm: 2800 };

describe("cutStrips", () => {
  it("without a pattern: floor(roll / strip) per roll, tails left over", () => {
    const cut = cutStrips({ ...base, strips: 7 });
    expect(cut).toEqual({ fits: true, rolls: 3, perRoll: 3, remnantsMm: [1650, 1650, 7250] });
  });

  it("puts short pieces into roll tails before opening a new roll", () => {
    const cut = cutStrips({ ...base, strips: 6, pieces: [800, 1500, 800] });
    // 1500 → roll 1 (tail 1650 → 150); 800 → roll 2 (1650 → 850); 800 → roll 2 (850 → 50).
    expect(cut.rolls).toBe(2);
    expect(cut.remnantsMm).toEqual([150, 50]);
  });

  it("straight match: each strip starts on the repeat", () => {
    // 2800 → 3200 per strip with a 640 repeat: 0–2800, 3200–6000, 6400–9200.
    const cut = cutStrips({ ...base, repeatMm: 640, strips: 3, pieces: [1500] });
    expect(cut.perRoll).toBe(3);
    // The piece must start at 9600: 9600 + 1500 > 10 050, so it needs a second roll.
    expect(cut).toMatchObject({ rolls: 2, remnantsMm: [850, 8550] });
  });

  it("offset match alternates phases 0 and repeat / 2, also across rolls", () => {
    // Roll 1: 0–2800, 2880–5680, 5760–8560; strip 4 needs phase 320 → roll 2 starts at 320.
    const cut = cutStrips({ ...base, repeatMm: 640, offset: true, strips: 4 });
    expect(cut).toEqual({ fits: true, rolls: 2, perRoll: 3, remnantsMm: [1490, 6930] });
  });

  it("an odd repeat keeps half a millimetre exact", () => {
    const cut = cutStrips({ ...base, repeatMm: 641, offset: true, strips: 2 });
    // 0–2800; second strip at phase 320.5: 320.5 + 641 × 4 = 2884.5 → 5684.5.
    expect(cut.remnantsMm).toEqual([10_050 - 5684.5]);
  });

  it("a strip longer than the roll does not fit; nothing to cut gives no rolls", () => {
    expect(cutStrips({ ...base, stripLengthMm: 10_100, strips: 1 })).toMatchObject({ fits: false, rolls: 0 });
    expect(cutStrips({ ...base, strips: 2, pieces: [10_051] }).fits).toBe(false);
    expect(cutStrips({ ...base, strips: 0 })).toMatchObject({ fits: true, rolls: 0, remnantsMm: [] });
  });
});
