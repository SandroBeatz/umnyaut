/** Page text from `content/tools/<id>.md`, already rendered and sanitised on the server at build time. */
export interface ToolText {
  title: string;
  description: string;
  h1: string;
  question: string;
  html: string;
  faq: readonly { q: string; a: string }[];
}
