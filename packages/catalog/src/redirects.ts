/**
 * 301 map for renamed or moved pages (tech spec §14 «Редиректы»): old path → new path, both with the trailing
 * slash. A renamed tool keeps its search history only through this list; never delete an entry.
 */
export const redirects: readonly { from: string; to: string }[] = [
  // «Смета» became «Список покупок» (owner, 2026-10-14); links already sent keep working (the `#` snapshot rides along).
  { from: "/smeta/", to: "/spisok/" },
];
