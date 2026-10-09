export { mascotImages } from "./mascot.gen";
export type MascotPose = keyof typeof import("./mascot.gen").mascotImages;
export { materialImages } from "./materials.gen";
export type MaterialKey = keyof typeof import("./materials.gen").materialImages;
