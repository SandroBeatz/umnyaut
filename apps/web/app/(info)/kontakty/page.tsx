import { loadPageContent } from "@server/content";
import { InfoPage, type InfoText, infoMetadata } from "@/views/info";

const { frontmatter, html } = loadPageContent("kontakty");
const text: InfoText = { ...frontmatter, html };

export const metadata = infoMetadata("/kontakty/", text);

export default function Page() {
  return <InfoPage text={text} />;
}
