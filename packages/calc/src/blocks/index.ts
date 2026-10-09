export { type CoverageInput, coverage } from "./coverage";
export {
  doorWidthMm,
  floorAreaM2,
  grossWallAreaM2,
  mm2ToM2,
  mmToM,
  openingsAreaM2,
  perimeterMm,
  polygonAreaMm2,
  polygonPerimeterMm,
  wallAreaM2,
} from "./geometry";
export { bestPackSet, ceilPacks, PACK_EPSILON, type PackOption, type PackSet, purchase } from "./packs";
export { cutStrips, type StripCut, type StripCutInput } from "./strips";
export { type WasteRule, wastePct, withWaste } from "./waste";
