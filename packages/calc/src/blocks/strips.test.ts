import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { cutStrips } from "./strips";

const base = { rollLengthMm: 10_050, repeatMm: 0, offset: false, stripLengthMm: 2800 };

describe("cutStrips", () => {
  it("without a pattern: floor(roll / strip) per roll, tails left over", () => {
    const cut = cutStrips({ ...base, strips: 7 });
    expect(cut).toMatchObject({
      fits: true,
      rolls: 3,
      perRoll: 3,
      perRollSlackMm: 1650,
      remnantsMm: [1650, 1650, 7250],
    });
    expect(cut.cuts.map((r) => r.map((c) => c.index))).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
  });

  it("puts short pieces into roll tails before opening a new roll", () => {
    const cut = cutStrips({ ...base, strips: 6, pieces: [800, 1500, 800] });
    // 1500 → roll 1 (tail 1650 → 150); 800 → roll 2 (1650 → 850); 800 → roll 2 (850 → 50).
    expect(cut.rolls).toBe(2);
    expect(cut.remnantsMm).toEqual([150, 50]);
  });

  it("straight match: each strip starts on the repeat, after a worst-case lead of repeat − 1 mm", () => {
    // Usable 10 050 − 639 = 9411; 2800 → 3200 per strip: 0–2800, 3200–6000, 6400–9200.
    const cut = cutStrips({ ...base, repeatMm: 640, strips: 3, pieces: [1500] });
    expect(cut.perRoll).toBe(3);
    // The piece must start at 9600: 9600 + 1500 > 9411, so it needs a second roll.
    expect(cut).toMatchObject({ rolls: 2, remnantsMm: [211, 7911] });
  });

  it("the lead can cost a strip: 3100 mm strips with a 640 repeat give 2 per roll", () => {
    // 0–3100, 3200–6300; 6400 + 3100 = 9500 > 9411.
    expect(cutStrips({ ...base, repeatMm: 640, stripLengthMm: 3100, strips: 2 }).perRoll).toBe(2);
  });

  it("offset match alternates phases 0 and repeat / 2; a new roll pays the lead once, whatever the phase", () => {
    // Roll 1: 0–2800, 2880–5680, 5760–8560; strip 4 (phase 320) opens roll 2 at 0 — the lead already reached it.
    const cut = cutStrips({ ...base, repeatMm: 640, offset: true, strips: 4 });
    expect(cut).toMatchObject({
      fits: true,
      rolls: 2,
      perRoll: 3,
      perRollSlackMm: 9411 - 8560,
      remnantsMm: [9411 - 8560, 9411 - 2800],
    });
  });

  it("offset with repeat 500: every roll, not only the first, gives 3 strips of 2900", () => {
    // Usable 9551: 0–2900, 3250–6150, 6500–9400 — in each roll's own frame (the review's double-lead case).
    // A fresh roll of one phase leaves more: 0–2900, 3000–5900, 6000–8900, slack 651 (formula review 2026-10-21).
    const cut = cutStrips({ ...base, repeatMm: 500, offset: true, stripLengthMm: 2900, strips: 32 });
    expect(cut).toMatchObject({ rolls: 11, perRoll: 3, perRollSlackMm: 651 });
  });

  it("offset 640, strips of 2900: each phase from its own roll — 12 rolls, not 16 (formula review 2026-10-21)", () => {
    // Alternating in one roll: 0–2900, 3520–6420, 7040 + 2900 > 9411 — 2 per roll, 16 rolls for 32 strips.
    // One phase per roll: 0–2900, 3200–6100, 6400–9300 — 3 per roll, 16 strips of each phase → 6 + 6 rolls.
    // Straight match gives ⌈32 / 3⌉ = 11: offset never needs more than straight + 1.
    const input = { ...base, repeatMm: 640, stripLengthMm: 2900, strips: 32 };
    expect(cutStrips({ ...input, offset: true })).toMatchObject({ rolls: 12, perRoll: 3 });
    expect(cutStrips({ ...input, offset: false }).rolls).toBe(11);
  });

  it("offset with given strip phases: same-phase strips share a roll", () => {
    const phases = Array.from({ length: 6 }, (_, k) => (k % 2) * 320);
    const cut = cutStrips({
      ...base,
      repeatMm: 640,
      offset: true,
      stripLengthMm: 2900,
      strips: 6,
      stripPhasesMm: phases,
    });
    expect(cut.rolls).toBe(2);
    expect(cut.cuts[0]?.map((c) => c.index)).toEqual([0, 2, 4]);
  });

  it("lucky start: no lead, the 3100 mm strips fit 3 per roll", () => {
    const input = { ...base, repeatMm: 640, stripLengthMm: 3100, strips: 3 };
    expect(cutStrips(input).rolls).toBe(2);
    expect(cutStrips({ ...input, luckyStart: true })).toMatchObject({ rolls: 1, perRoll: 3 });
  });

  it("an odd repeat keeps half a millimetre exact", () => {
    const cut = cutStrips({ ...base, repeatMm: 641, offset: true, strips: 2 });
    // Usable 10 050 − 640 = 9410; 0–2800; second strip at phase 320.5: 320.5 + 641 × 4 = 2884.5 → 5684.5.
    expect(cut.remnantsMm).toEqual([9410 - 5684.5]);
  });

  it("a strip or a piece longer than the roll does not fit; nothing to cut gives no rolls", () => {
    expect(cutStrips({ ...base, stripLengthMm: 10_100, strips: 1 })).toMatchObject({
      fits: false,
      tooLong: "strip",
      rolls: 0,
    });
    expect(cutStrips({ ...base, strips: 2, pieces: [10_051] })).toMatchObject({ fits: false, tooLong: "piece" });
    expect(cutStrips({ ...base, strips: 0 })).toMatchObject({ fits: true, rolls: 0, remnantsMm: [] });
  });

  it("offset match never needs more than straight + 1 roll (formula review 2026-10-21)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 9000 }),
        fc.integer({ min: 2, max: 1500 }),
        fc.integer({ min: 0, max: 80 }),
        (strip, repeat, strips) => {
          const input = { rollLengthMm: 10_050, repeatMm: repeat, stripLengthMm: strip, strips };
          const straight = cutStrips({ ...input, offset: false });
          const offset = cutStrips({ ...input, offset: true });
          if (straight.fits && offset.fits) expect(offset.rolls).toBeLessThanOrEqual(straight.rolls + 1);
        },
      ),
    );
  });
});
