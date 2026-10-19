import type { CSSProperties } from "react";
import { cn } from "../lib/cn";
import { type ResponsiveImage, srcSet } from "./types";

/** One brush-stroke mask for every category card: ragged strokes on the top and left, full bleed bottom-right. */
const BRUSH = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><path d="M300 6C252 10 214 16 176 24c-30 6-62 12-96 24-14 5-22 13-16 22-14 6-26 16-22 28-14 8-20 20-12 32-12 10-18 22-10 36-8 10-12 20-8 28H300Z"/><path d="M300 0c-58 3-110 8-156 16l2 7C192 15 246 9 300 7Z"/><path d="M118 34c-24 6-44 14-62 24l4 6c18-9 38-17 60-23Z"/><path d="M34 104c-10 10-16 22-18 34l6 2c3-12 8-23 16-32Z"/><path d="M22 168c-6 10-8 20-8 30h6c1-10 3-19 8-27Z"/></svg>',
)}")`;
const mask = { maskImage: BRUSH, WebkitMaskImage: BRUSH, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" };

export interface CategoryPhotoProps {
  image: ResponsiveImage;
  /** Rendered width in CSS px on phone and from 1024 px. */
  size: number;
  sizeLg?: number;
  className?: string;
}

/** Category photo (design spec §10): 3:2 frame under the brush-stroke mask; decorative, the card names the category. */
export function CategoryPhoto({ image, size, sizeLg, className }: CategoryPhotoProps) {
  const sizes = sizeLg ? `(min-width: 1024px) ${sizeLg}px, ${size}px` : `${size}px`;
  return (
    <picture className={cn("block", className)} style={mask as CSSProperties}>
      <source type="image/avif" srcSet={srcSet(image.avif)} sizes={sizes} />
      <img
        src={image.webp.at(-1)?.src}
        srcSet={srcSet(image.webp)}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
    </picture>
  );
}
