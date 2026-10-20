import { SharedEstimate, type SharedEstimateProps } from "./SharedEstimate";

/**
 * Someone's estimate as a document, without the site header and footer: `/spisok/prosmotr/#s=…` (Р14) — a static
 * frame, the estimate appears after mount — or `/p/<id>/` (P17.17) with the snapshot from the server.
 */
export function SharedEstimatePage({ data }: SharedEstimateProps) {
  return (
    <main className="flex flex-1 flex-col bg-surface" data-document>
      <SharedEstimate {...(data === undefined ? {} : { data })} />
    </main>
  );
}
