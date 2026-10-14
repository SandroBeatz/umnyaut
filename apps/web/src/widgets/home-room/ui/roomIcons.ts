import type { RoomType } from "@umnyaut/calc";
import { Bath, BedDouble, CookingPot, DoorOpen, House, type LucideIcon, Sofa } from "lucide-react";

/** The room type's picture in «Ваш ремонт». */
export const roomIcons: Record<RoomType, LucideIcon> = {
  living: Sofa,
  bedroom: BedDouble,
  kitchen: CookingPot,
  bathroom: Bath,
  hall: DoorOpen,
  other: House,
};
