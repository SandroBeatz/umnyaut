import { loadPageContent } from "@server/content";
import { InfoPage, type InfoText, infoMetadata, NormTable } from "@/views/info";

const { frontmatter, html } = loadPageContent("metodika");
const text: InfoText = { ...frontmatter, html };

export const metadata = infoMetadata("/metodika/", text);

export default function Page() {
  return (
    <InfoPage text={text}>
      <NormTable />
    </InfoPage>
  );
}
