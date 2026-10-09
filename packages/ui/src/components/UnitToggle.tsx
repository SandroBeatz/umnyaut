"use client";

import { Segment, type SegmentOption } from "./Segment";

export type LengthUnit = "m" | "cm";

export interface UnitToggleProps {
  value: LengthUnit;
  onValueChange: (value: LengthUnit) => void;
  /** Labels from catalog: { m: "м", cm: "см" }; `label` is the group name («Единицы»). */
  labels: Record<LengthUnit, string>;
  label: string;
  className?: string;
}

/** Compact m / cm switch next to a group of dimension fields. */
export function UnitToggle({ value, onValueChange, labels, label, className }: UnitToggleProps) {
  const options: SegmentOption<LengthUnit>[] = [
    { value: "m", label: labels.m },
    { value: "cm", label: labels.cm },
  ];
  return (
    <Segment
      options={options}
      value={value}
      onValueChange={onValueChange}
      label={label}
      size="sm"
      className={className}
    />
  );
}
