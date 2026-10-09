import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import { type ResponsiveImage, srcSet } from "./types";

export interface MascotProps {
  image: ResponsiveImage;
  /** Rendered width in CSS px on phone and from 1024 px (design system sizes: hero 160/400, result 56/96…). */
  size: number;
  sizeLg?: number;
  /**
   * Describes the pose when it carries meaning; `""` when it only repeats visible text (the bubble text is
   * always duplicated in normal text, so most placements are decorative).
   */
  alt: string;
  /** Mint spot behind the cat (required in dark theme). */
  spot?: boolean;
  /** First-screen hero: eager + high fetch priority. */
  priority?: boolean;
  className?: string;
}

/** The «Умняут» mascot. One per view, never covers numbers or fields, only a 200 ms fade-in. */
export function Mascot({ image, size, sizeLg, alt, spot = false, priority = false, className }: MascotProps) {
  const sizes = sizeLg ? `(min-width: 1024px) ${sizeLg}px, ${size}px` : `${size}px`;
  const fallback = image.webp.at(-1);
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 [width:var(--mascot-w)] lg:[width:var(--mascot-w-lg)]",
        spot && "isolate",
        className,
      )}
      style={{ "--mascot-w": `${size}px`, "--mascot-w-lg": `${sizeLg ?? size}px` } as CSSProperties}
    >
      {spot ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-[6%] top-[14%] bottom-0 -z-10 rounded-[46%_54%_48%_52%/52%_46%_54%_48%] bg-surface-mint"
        />
      ) : null}
      <picture>
        <source type="image/avif" srcSet={srcSet(image.avif)} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(image.webp)} sizes={sizes} />
        <img
          src={fallback?.src}
          srcSet={srcSet(image.webp)}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          className="block h-auto w-full motion-safe:animate-[fade-in_200ms_var(--ease-standard)]"
        />
      </picture>
    </span>
  );
}
