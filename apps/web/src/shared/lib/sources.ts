/** One norm source: the name readers see and the page it points to. */
export interface SourceLink {
  label: string;
  url?: string;
}

/** «Name, https://…» → label and link; plain text («по опыту укладчиков») stays a label. */
export function splitSources(source: string): SourceLink[] {
  return source.split("; ").map((part) => {
    const match = /^(.*?),?\s*(https?:\/\/\S+)$/.exec(part.trim());
    return match ? { label: match[1] || match[2] || part, url: match[2] } : { label: part.trim() };
  });
}

/** Sources of several norms (each may join a few with «; ») as links, each source once. */
export function sourceLinks(sources: readonly string[]): SourceLink[] {
  const byLabel = new Map(sources.flatMap(splitSources).map((link) => [link.label, link] as const));
  return [...byLabel.values()];
}
