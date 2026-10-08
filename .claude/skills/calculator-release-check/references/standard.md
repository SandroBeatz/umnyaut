# Calculator standard — 16 requirements

Requirements 1–14 are mandatory for every tool. 15 is mandatory where layout affects the result (tile, laminate, wallpaper, linoleum). 16 where the material has standard formats.

| # | Requirement | Meaning | Where to look for evidence |
|---|---|---|---|
| 1 | Purchase units | Whole packages, how much will be bought, leftover | `PurchaseItem.packs` integer, `bought`, `leftover`; `ceilPacks()` used |
| 2 | Waste by method | % depends on layout, repeat, room shape; overridable | `WasteRule` in calc; waste field in catalog `FieldDef` |
| 3 | Openings & shape | Windows, doors, niches; non-rectangular rooms | `{ kind: 'openings' }` field or `Room.shape` support |
| 4 | Related materials | “What else you'll need” with quantities | items with `role: 'related'` |
| 5 | Cost | Pack price optional; total and price per m² | `{ kind: 'price' }` field; `result.cost` |
| 6 | Warnings | Signal on out-of-bounds input/result | ≥ 1 warning code in calc + RU text in catalog |
| 7 | “How calculated” | Formula with user's numbers | non-empty `steps` with substituted values |
| 8 | Norm source | Methodology link + last checked date | catalog norms have `source` + `checkedAt`; frontmatter `checkedAt` |
| 9 | Report an error | One button, no registration | shell `ReportError` present (global) |
| 10 | Tests | 10 golden examples | `golden.ts` length ≥ 10, each with `source` |
| 11 | Instant result | Typical values prefilled, live recalc | `defaults()` produces a valid result; SSR HTML has numbers |
| 12 | Phone input | Numeric keyboard, big fields, m and cm | `kind: 'length'` fields with units; bounds set |
| 13 | Room remembered | Dimensions carry to the next tool | fields bound via `room: 'length' | 'width' | 'height'` |
| 14 | Save & send | Link, messenger text, print | shell `ResultActions` (global); `?s=` encodes this tool's input |
| 15 | Scheme | Where layout affects result | `result.layout` + `layout-scheme/<id>.tsx` |
| 16 | Presets | Typical sizes, popular products | `{ kind: 'preset' }` with presets in catalog |

## Definition of done (beyond the 16)

- Five files present; text 300–600 words with valid frontmatter.
- Lighthouse thresholds pass; events arrive in Metrika.
- Checked manually on a real phone.
- Electrical / heating / screed tools: `disclaimer` flag set.
