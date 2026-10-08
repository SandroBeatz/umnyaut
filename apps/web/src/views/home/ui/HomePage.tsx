import { site } from "@umnyaut/catalog";

export function HomePage() {
  return (
    <main>
      <h1>{site.name}</h1>
      <p>{site.tagline}</p>
    </main>
  );
}
