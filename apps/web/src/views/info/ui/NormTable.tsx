import { methodology as t } from "@umnyaut/catalog";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { normGroups } from "../model/norm-rows";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Norms with value, source and check date, one table per tool (design spec §13 «Справочная»: mint head). */
export function NormTable() {
  return (
    <section aria-labelledby="norms" className="mt-10">
      <h2 id="norms" className="text-h2">
        {t.norms}
      </h2>
      <p className="mt-1 max-w-[44rem] text-body text-text-muted">{t.normsLead}</p>
      {normGroups().map((group) => (
        <div key={group.tool?.id ?? "other"} className="mt-6">
          <h3 className="text-h3">{group.tool?.title ?? t.other}</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] border-collapse text-small">
              <thead className="bg-surface-mint text-left">
                <tr>
                  <th scope="col" className="sticky left-0 bg-surface-mint px-3 py-2 font-semibold">
                    {t.norm}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    {t.value}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t.source}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t.checked}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.rows.map(({ id, title, norm, sources }) => (
                  <tr key={id} className="align-top">
                    <th scope="row" className="sticky left-0 bg-surface px-3 py-2 text-left font-medium">
                      {title}
                      {/* An unconfirmed norm's note is a working note for the reviewer; the reader gets the label hint. */}
                      {norm.unconfirmed ? (
                        <span className="block font-normal text-accent-text">{t.unconfirmed}</span>
                      ) : norm.note ? (
                        <span className="block font-normal text-text-muted">{norm.note}</span>
                      ) : null}
                    </th>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(norm.value)}
                      {NBSP}
                      {norm.unit}
                    </td>
                    <td className="px-3 py-2">
                      {sources.map((source, i) => (
                        <span key={source.label} className="block">
                          {source.url ? (
                            <a
                              href={source.url}
                              rel="noopener noreferrer"
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {source.label}
                            </a>
                          ) : (
                            source.label
                          )}
                          {i < sources.length - 1 ? ";" : null}
                        </span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {dateFormat.format(new Date(`${norm.checkedAt}T00:00:00Z`))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
