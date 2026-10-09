import localFont from "next/font/local";

// Subset built by `pnpm --filter @umnyaut/ui font` (design system: typography).
export const onest = localFont({
  src: "../../../packages/ui/assets/fonts/onest-var.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-onest",
  preload: true,
});
