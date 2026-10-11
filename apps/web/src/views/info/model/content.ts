/** Info page text from `content/pages/<slug>.md`, rendered and sanitised on the server at build time. */
export interface InfoText {
  title: string;
  description: string;
  h1: string;
  /** YYYY-MM-DD. */
  updatedAt: string;
  draft: boolean;
  html: string;
}
