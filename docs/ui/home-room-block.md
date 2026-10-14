---
version: 1.3
date: 2026-10-14
category: ui
---

# Home Room Block

> Version 1.3 · 2026-10-14 · [UI](../ui/)

## Overview

The room block is the card next to the hero on the home page (`/`). It replaces the old “Моя комната” card (P8.1: sizes, work chips, «Выбрать расчёт»). The estimate now holds several rooms (Phase 17), so the block works in two states (owner concept, 2026-10-14):

- **«Какую комнату считаем?»**: type chips, the isometric scheme, sizes in metres, floor/walls/ceiling areas and the orange «Посчитать материалы», which opens the type's usual calculators in a popup. Shown on a first visit and while nothing is in the list yet.
- **«Ваш ремонт»**: the estimate's rooms with area, number of calcs and sum, «Итого по списку», the orange «Открыть список» and «+ Добавить комнату». Shown once at least one calc has been added to the list.

Under the hero, the example strip «Для комнаты 12 м² нужно» stays. It now follows the **room type** instead of the work chips, which are gone.

## Design decisions

### State selection

```
server render / first client render ──► «Какую комнату считаем?» with the 4 × 3 × 2,7 м example (rule 4)
            │ after mount: hydrateEstimate()
            ▼
   hasCounted(estimate)? ── no ──► form (stored active room over the example)
            │ yes
            ▼
     «Ваш ремонт» ──«+ Добавить комнату»──► room editor («Новая комната») ──«Посчитать материалы»──► suggestions popup
```

- `hasCounted` = some calc has `addedAt` (spec Р4). Drafts alone keep the form.
- The server always renders the form, so the static HTML and the first client render match. A returning user sees the card switch to «Ваш ремонт» after mount. We deliberately do not reserve the form's height. A reserved height left a large empty gap inside «Ваш ремонт», and the shift barely registers: on the phone the card starts below the hero text, and the strip under it is below the fold on both phone and desktop.

### First state: «Какую комнату считаем?»

| Part | Behaviour |
|---|---|
| Title | «Какую комнату считаем?». Sizes are in metres only (the m / cm toggle was dropped, owner 2026-10-14; the room editor keeps it) |
| Type chips | `home.room.types`: Зал, Спальня, Кухня, Ванная, Прихожая. One row that scrolls sideways on the phone. «Другое» stays in the room editor; a room of type `other` shows no chip selected. The selected chip has a check mark and `aria-pressed` |
| `RoomScheme` | The same isometric box as before (`entities/room`) |
| Длина / Ширина / Высота | `NumberField`, limits 0,3–100 м (height 1–10 м). An out-of-range value is not written |
| Mint summary | Floor, walls, ceiling in m², from `floorAreaM2` / `wallAreaM2` of `@umnyaut/calc` (rule 1). Walls are net of the room's doors and windows (the example room has one door) |
| «Окна и двери» row | Under the areas, inside the mint block: «Окна и двери: 1 дверь, 2 окна» (`openingsText`) or «…: нет», and a small teal button «Изменить» / «Добавить» (40 px, 48 px tap area). It opens the site-wide room editor (`RoomEditor` from `features/edit-room`: name, type, shape, sizes, doors and windows with their walls). The editor needs a stored room, so opening it first saves the example as shown. Saving the editor updates the active room, and the areas and strip follow |
| «Посчитать материалы» | The only orange element; no note under it (dropped, owner 2026-10-14). Saves the room and opens the suggestions popup; it stays in place, so a second tap reopens the popup |
| Suggestions popup | `ResponsiveSheet` (bottom sheet on the phone, 480 px dialog from 1024 px): title «Что считаем: Зал», description «Размеры уже в калькуляторах», three links from `roomSuggestions[type]` (the same list as the empty room card on `/spisok/`; the kitchen gets laminate, tile, paint). Each link makes the room active and opens the tool. «Все расчёты» closes the popup; when the popup returns focus to the button, the button's `onFocus` moves on to the categories (scroll + focus on their heading), so the returned focus never scrolls the page back |

**Writes.** In the normal form every edit goes straight to the active room (spec scenario 1: the estimate is created silently):

- When there is no active room yet, the first size, or the button, creates one with the whole shown room (example sizes and door included), the chosen type and a name for that type («Зал»; «Зал 2» if taken, via `nameForType` from `features/edit-room`).
- Changing a stored room's type renames it only if the name is still automatic. A name the user typed stays.
- With no stored room, the type stays local until the first size or the button.

### Second state: «Ваш ремонт»

- Header: «Ваш ремонт» and «2 комнаты» (Russian plural).
- Rows (`roomLines`): the active room first, then estimate order. At most `ROOMS_SHOWN` = 3 rows; the rest become «и ещё N комнат в списке».
- Each row shows the type icon (`roomIcons`: sofa, bed, pot, bath, door, house) in a mint square, the name and «19,8 м² · 3 расчёта». An empty room shows «пока ничего не посчитано».
- The sum comes from the saved `totals.byRoom` (Р3). No calculators are loaded on the home page; rooms without prices show no sum.
- A row opens the calculator of the room's last opened counted calc (`setActiveRoom` + `openCalc`, like the rows on `/spisok/`). A room with nothing counted opens the first usual tool of its type.
- «Итого по списку» (mint) appears only when `totals.sum > 0`.
- «Открыть список» (orange) → `/spisok/`.
- «+ Добавить комнату» (outlined, teal) opens the site-wide room editor for a new room (owner, 2026-10-14): the type is the first one the estimate has no room of (`freshType`: a flat with a Зал and a Ванная gets «Спальня»), the name follows it, the ceiling height comes from the active room, and the save button reads «Посчитать материалы» (`saveLabel`). Saving adds the room, closes the editor and opens the suggestions popup for it (`onSaved`); the list then shows the new room as «пока ничего не посчитано». Hidden at the 20-room limit (`ESTIMATE_LIMITS.rooms`).

### Example strip by room type

`home.typeWorks` maps each room type to works of the strip:

| Type | Works → cards |
|---|---|
| Зал, Спальня, Прихожая, Другое | floor (laminate, plinth), walls (wallpaper), ceiling (paint) |
| Кухня | floor (laminate, plinth), tile, ceiling — laminate is a usual kitchen floor too (owner, 2026-10-14) |
| Ванная | tile, ceiling |

The server computes the cards for the example room of type `living` (`initialExample()`). The browser recomputes (lazy `model/cards`) only when the room, the type's works or the country differ (`isInitialExample`). Types with the same works as `living` keep the server cards. In «Ваш ремонт» it follows the active room.

## Configuration

All strings live in `packages/catalog/src/home.ts` (rule 7):

| Key | What |
|---|---|
| `home.room.*` | First state: title, type chips order (`types`), field labels, summary labels, openings row (`openings`, `openingsNone`, `doorForms`, `windowForms`, `openingsAdd`, `openingsEdit`, `openingsLabel`), button, popup (`next`, `nextNote`, `open`, `all`) |
| `home.rooms.*` | Second state: title, counts with plural forms (`roomForms`, `calcForms`), `meta`, `empty`, `more`, `open` (row aria-label), `total`, `list`, `add` |
| `home.typeWorks` | Room type → works of the example strip |
| `home.works` | Works and their example items (no longer chips: `label` and `selected` were removed) |
| `home.exampleRoom` | 4 × 3 × 2,7 м with one door |

Type labels come from `shell.roomEditor.types`; suggestions from `roomSuggestions` in `packages/catalog/src/estimate.ts`.

## Usage

`views/home/ui/HomePage.tsx` renders the widget with the server hero and the server-computed cards:

```tsx
<HomeRoom hero={<Hero />} categoriesId={CATEGORIES_ID} initialCards={initialExample()} />
```

Pure helpers are tested in Vitest:

- `model/example.test.ts`: the strip by type, the first state, the doors-and-windows text, surfaces (4,6 × 4,3 × 2,7 м → 19,78 / 48,06 m²; the example door → walls 36,2 m²).
- `model/rooms.test.ts`: when «Ваш ремонт» appears, row order, meta, sums, where rows lead, plurals.
- `packages/catalog/src/home.test.ts`: every type maps to existing works.

Phone journeys in `apps/web/e2e/home.spec.ts`:

1. Sizes recompute the strip; «Ванная» swaps laminate for tile; «Посчитать материалы» → popup → «Все расчёты» → a category with the room carried over.
2. «Кухня» → a suggested calculator opens with the room.
3. A seeded estimate greets with «Ваш ремонт»; «Добавить комнату» opens «Новая комната» as «Спальня»; «Посчитать материалы» → «Что считаем: Спальня»; three rooms; «Открыть список» → `/spisok/`.
4. «Изменить окна и двери» → the room editor → «Окно» → save: the row reads «1 дверь, 1 окно» and the walls shrink.

## Cross-references

- [Calculator Shell, Pages and Routing](./calculator-shell-and-pages.md): home route, hydration rule, `RoomBar` that shows the same active room on tool pages
- [Room Plan, Layout Schemes and Laying Guides](./room-plan-and-layout-guides.md): `RoomScheme`, `FloorPlan` and the room editor's plan
- [Design System](../design/design-system.md): tokens, one orange element per view, 48 px targets
- [Calculation Engine](../code/calc-engine.md): `floorAreaM2`, `wallAreaM2`, the estimate schema and `totals`
- [Architecture Overview](../architecture/overview.md): FSD layers (`widgets/home-room` uses `features/edit-room` and `entities/*`)
- RU spec `docs/specs/UmnyAut — комнаты и смета спецификация.md`: rooms, the estimate, Р3 (totals), Р4 (added calcs), scenario 1
- [Development Plan](../plan/development-plan.md): P8.1 (old card), Phase 17

## File Structure

| Path | What |
|---|---|
| `apps/web/src/widgets/home-room/ui/HomeRoom.tsx` | State selection, writes to the estimate, example strip |
| `apps/web/src/widgets/home-room/ui/RoomForm.tsx` | «Какую комнату считаем?» |
| `apps/web/src/widgets/home-room/ui/SuggestionsSheet.tsx` | «Что считаем: …» popup, opened by «Посчитать материалы» or after the editor saves a new room |
| `apps/web/src/widgets/home-room/ui/RoomsList.tsx` | «Ваш ремонт» and the new-room editor |
| `apps/web/src/widgets/home-room/ui/roomIcons.ts` | Room type → lucide icon |
| `apps/web/src/widgets/home-room/model/example.ts` | Example room, `worksOf`, `isInitialExample`, `surfacesOf` |
| `apps/web/src/widgets/home-room/model/cards.ts` | Strip cards computed by the tools (lazy in the browser) |
| `apps/web/src/widgets/home-room/model/rooms.ts` | `hasCounted`, `roomLines`, `suggestedTools`, `roomCount`, `freshType`, `SavedRoomRef` |
| `apps/web/src/entities/room/model/format.ts` | `floorOf`, `areaText` (moved here from `views/estimate` to be shared) |
| `packages/catalog/src/home.ts` | Strings, `typeWorks`, example room |
| `apps/web/e2e/home.spec.ts` | Phone journeys |
