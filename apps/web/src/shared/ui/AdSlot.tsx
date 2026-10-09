/**
 * Reserved ad place (business spec §17). Inert before stage 3: renders nothing, so it takes no space and
 * never pushes the result down. When enabled it will reserve its min-height to avoid layout shift.
 */
export function AdSlot(_props: { placement: "after-result" | "in-text" }) {
  return null;
}
