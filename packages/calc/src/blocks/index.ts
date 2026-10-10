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
export { type GridArea, type GridLine, gridArea, gridLine } from "./grid";
export { bestPackSet, ceilPacks, PACK_EPSILON, type PackOption, type PackSet, purchase, purchaseSet } from "./packs";
export { layRows, type RowsInput, type RowsResult } from "./rows";
export { cutStrips, type StripCut, type StripCutInput } from "./strips";
export { type WasteRule, wastePct, withWaste } from "./waste";
