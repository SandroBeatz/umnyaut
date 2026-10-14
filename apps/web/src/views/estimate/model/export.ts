import { estimatePage, shell } from "@umnyaut/catalog";
import { type Country, formatMoney, plural } from "@umnyaut/ui/format";
import { fill } from "@/shared/lib";
import type { EstimateBoard } from "./board";

const t = estimatePage.export;

/**
 * The estimate as plain text for a messenger (spec «Экспорт»): the name, each room with «Ламинат — 10 пачек —
 * 11 200 ₽ (пол · + подложка 2 рулона)», the shared consumables, the total. A calc whose purchase is all shared
 * consumables has no line of its own: it is in the shared block.
 */
export function estimateText(name: string, board: EstimateBoard, country: Country): string {
  const money = (sum: number | undefined) => (sum ? fill(t.lineSum, { sum: formatMoney(sum, country) }) : "");
  const rooms = board.rooms.map((card) => [
    card.room.name,
    ...card.rows.flatMap((row) =>
      row.quantity
        ? [
            `${fill(t.line, { title: row.title, quantity: row.quantity })}${money(row.cost)}${row.caption ? ` (${row.caption})` : ""}`,
          ]
        : [],
    ),
  ]);
  const shared =
    board.shared.length > 0
      ? [
          [
            estimatePage.shared.title,
            ...board.shared.map(
              (row) =>
                `${fill(t.line, { title: row.title, quantity: row.quantity })}${row.detail ? ` (${row.detail})` : ""}${money(row.cost)}`,
            ),
          ],
        ]
      : [];
  const { sum, missing } = board.total;
  const total =
    sum > 0
      ? [
          [
            fill(t.total, { sum: formatMoney(sum, country) }) +
              (missing > 0
                ? `, ${fill(shell.result.missing, { count: missing, positions: plural(missing, shell.result.positions) })}`
                : ""),
          ],
        ]
      : [];
  return [[name], ...rooms, ...shared, ...total].map((block) => block.join("\n")).join("\n\n");
}
