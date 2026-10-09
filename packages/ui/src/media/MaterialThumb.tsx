import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { type ResponsiveImage, srcSet } from "./types";

export interface MaterialThumbProps {
  /** Missing photo → mint tile with the category icon; a tool never waits for an image. */
  image?: ResponsiveImage;
  fallbackIcon: ReactNode;
  /** Material name, e.g. «Ламинат». Empty when the name is printed next to the thumb. */
  alt: string;
  size?: 56 | 64 | 96;
  className?: string;
}

const box = { 56: "size-14", 64: "size-16", 96: "size-24" } as const;

/** Square material photo for shopping-list rows. */
export function MaterialThumb({ image, fallbackIcon, alt, size = 64, className }: MaterialThumbProps) {
  const classes = cn("flex shrink-0 items-center justify-center overflow-hidden rounded-md", box[size], className);
  if (!image) {
    const tile = cn(classes, "bg-surface-mint text-primary-hover [&_svg]:size-6");
    return alt ? (
      <span role="img" aria-label={alt} className={tile}>
        {fallbackIcon}
      </span>
    ) : (
      <span aria-hidden="true" className={tile}>
        {fallbackIcon}
      </span>
    );
  }
  const sizes = `${size}px`;
  return (
    <span className={cn(classes, "bg-surface-sunken")}>
      <picture>
        <source type="image/avif" srcSet={srcSet(image.avif)} sizes={sizes} />
        <img
          src={image.webp.at(-1)?.src}
          srcSet={srcSet(image.webp)}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      </picture>
    </span>
  );
}
