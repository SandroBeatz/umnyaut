import type { Metadata } from "next";
import type { InfoText } from "./content";

/** A draft (text not approved by the owner yet) is built but not indexed. */
export function infoMetadata(path: string, text: InfoText): Metadata {
  return {
    title: text.title,
    description: text.description,
    alternates: { canonical: path },
    ...(text.draft && { robots: { index: false, follow: false } }),
  };
}
