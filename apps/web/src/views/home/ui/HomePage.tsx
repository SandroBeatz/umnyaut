import { comingSoon, site } from "@umnyaut/catalog";
import { FeatureIcon } from "./FeatureIcon";

const blueprint = {
  backgroundImage:
    "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
  maskImage: "radial-gradient(ellipse 80% 70% at 70% 30%, #000 20%, transparent 75%)",
} as const;

/** "Coming soon" home until the first tools go live (Phase 5). */
export function HomePage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60" style={blueprint} />

      <header className="mx-auto w-full max-w-[1200px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        {/* biome-ignore lint/performance/noImgElement: static SVG logo, no optimisation needed */}
        <img src="/brand/logo.svg" alt={site.name} width={221} height={68} className="h-8 w-auto lg:h-10" />
      </header>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 content-start gap-6 px-4 py-6 sm:px-6 lg:content-center lg:items-center lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:px-8 lg:py-12">
        <section className="order-2 lg:order-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 font-medium text-primary-hover text-xs uppercase tracking-wide">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full motion-safe:animate-ping bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {comingSoon.badge}
          </p>

          <h1 className="mt-5 font-extrabold text-[32px] leading-[38px] tracking-tight lg:text-5xl lg:leading-[54px]">
            {comingSoon.titleLead} <span className="text-primary">{comingSoon.titleAccent}</span>
          </h1>

          <p className="mt-4 max-w-[34rem] text-base text-text-muted leading-6 lg:text-lg lg:leading-7">
            {comingSoon.lead}
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3 lg:mt-10">
            {comingSoon.features.map((feature) => (
              <li key={feature.icon} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-hover">
                  <FeatureIcon name={feature.icon} />
                </span>
                <h2 className="mt-3 font-bold text-base leading-6">{feature.title}</h2>
                <p className="mt-1 text-sm text-text-muted leading-5">{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <figure className="order-1 flex items-center gap-3 lg:order-2 lg:flex-col lg:items-end lg:gap-0">
          <figcaption className="relative order-1 max-w-[13rem] flex-1 rounded-xl border border-border bg-surface px-3 py-2 font-semibold text-sm leading-5 shadow-md lg:order-0 lg:mr-6 lg:mb-2 lg:flex-none lg:text-base lg:leading-6">
            {comingSoon.bubble}
            <span
              aria-hidden="true"
              className="absolute top-1/2 -right-[7px] size-3 -translate-y-1/2 rotate-45 border-border border-t border-r bg-surface lg:top-auto lg:right-auto lg:-bottom-[7px] lg:left-1/3 lg:translate-y-0 lg:rotate-[135deg]"
            />
          </figcaption>
          <div className="relative order-2 w-[132px] shrink-0 sm:w-[160px] lg:order-1 lg:w-[400px] lg:self-center">
            <div
              aria-hidden="true"
              className="absolute inset-x-[4%] top-[14%] bottom-0 -z-10 rounded-[46%_54%_48%_52%/52%_46%_54%_48%] bg-surface-mint"
            />
            <picture>
              <source type="image/avif" srcSet="/img/mascot/hello-320.avif 320w, /img/mascot/hello-640.avif 640w" />
              <source type="image/webp" srcSet="/img/mascot/hello-320.webp 320w, /img/mascot/hello-640.webp 640w" />
              <img
                src="/img/mascot/hello-640.webp"
                srcSet="/img/mascot/hello-320.webp 320w, /img/mascot/hello-640.webp 640w"
                sizes="(min-width: 1024px) 400px, 160px"
                width={640}
                height={633}
                alt={comingSoon.mascotAlt}
                fetchPriority="high"
                className="h-auto w-full motion-safe:animate-[fade-in_200ms_var(--ease-standard)]"
              />
            </picture>
          </div>
        </figure>
      </main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-col gap-1 px-4 pt-4 pb-6 text-text-muted text-xs sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>{comingSoon.markets}</span>
      </footer>
    </div>
  );
}
