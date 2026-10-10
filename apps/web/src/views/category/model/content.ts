/** Category text from `content/categories/<slug>.md`, rendered and sanitised on the server at build time. */
export interface CategoryText {
  title: string;
  description: string;
  h1: string;
  lead: string;
  html: string;
  faq: readonly { q: string; a: string }[];
}
