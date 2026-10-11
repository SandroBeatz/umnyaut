import { loadPageContent } from "@server/content";
import { InfoPage, type InfoText, infoMetadata } from "@/views/info";

const { frontmatter, html } = loadPageContent("o-proekte");
const text: InfoText = { ...frontmatter, html };

export const metadata = infoMetadata("/o-proekte/", text);

export default function Page() {
  return <InfoPage text={text} mascot />;
}
