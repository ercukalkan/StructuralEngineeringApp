export type UnitPair = [forceUnit: ForceUnit, lengthUnit: LengthUnit];

type ForceUnit = 'N' | 'kN' | 'lb' | 'tonf';
type LengthUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in';

export const inputUnitPairs: UnitPair[] = [
  ['kN', 'm'],
  ['N', 'm'],
  ['kN', 'cm'],
  ['N', 'cm'],
  ['kN', 'mm'],
  ['N', 'mm'],
  ['lb', 'ft'],
  ['lb', 'in'],
  ['tonf', 'm'],
];

export const outputUnitPairs: UnitPair[] = [
  ['kN', 'm'],
  ['N', 'm'],
  ['kN', 'cm'],
  ['N', 'cm'],
  ['kN', 'mm'],
  ['N', 'mm'],
  ['lb', 'ft'],
  ['lb', 'in'],
  ['tonf', 'm'],
];
