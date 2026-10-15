import { SharedEstimate } from "./SharedEstimate";

/**
 * `/spisok/prosmotr/#s=…` (Р14): someone's estimate as a document. A static frame without the site header and
 * footer; the estimate is in the address after `#`, so it appears after mount.
 */
export function SharedEstimatePage() {
  return (
    <main className="flex flex-1 flex-col bg-surface" data-document>
      <SharedEstimate />
    </main>
  );
}
