import { loadPageContent } from "@server/content";
import { InfoPage, type InfoText, infoMetadata } from "@/views/info";

const { frontmatter, html } = loadPageContent("politika");
const text: InfoText = { ...frontmatter, html };

export const metadata = infoMetadata("/politika/", text);

export default function Page() {
  return <InfoPage text={text} />;
}
