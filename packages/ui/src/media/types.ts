/** A pre-built responsive image (AVIF + WebP at fixed widths), e.g. from apps/web/scripts/images.mjs. */
export interface ResponsiveImage {
  /** Intrinsic size of the cropped source — gives the aspect ratio. */
  width: number;
  height: number;
  avif: readonly { w: number; src: string }[];
  webp: readonly { w: number; src: string }[];
}

export const srcSet = (sources: ResponsiveImage["avif"]) => sources.map(({ w, src }) => `${src} ${w}w`).join(", ");
