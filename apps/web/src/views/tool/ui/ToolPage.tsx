import { strings, type ToolDef } from "@umnyaut/catalog";

export function ToolPage({ tool }: { tool: ToolDef }) {
  return (
    <main>
      <h1>{tool.title}</h1>
      {tool.status === "draft" && <p>{strings.draftNotice}</p>}
    </main>
  );
}
