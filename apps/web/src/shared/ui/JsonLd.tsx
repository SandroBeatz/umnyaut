/** Structured data in the static HTML; `<` is escaped so no text can close the script tag. */
export function JsonLd({ data }: { data: object | readonly object[] }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON built by our code, `<` escaped
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
