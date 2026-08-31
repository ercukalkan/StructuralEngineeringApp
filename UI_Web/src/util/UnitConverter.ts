import SupportReaction from '../Interfaces/SupportReaction';
import { UnitPair } from '../Types/UnitPair';

/** Supported unit families for structural engineering calculations. */
export type UnitCategory =
  | 'length'
  | 'area'
  | 'volume'
  | 'force'
  | 'moment'
  | 'stress'
  | 'density'
  | 'mass';

/**
 * Converts values between common structural engineering units.
 *
 * Units in each category are converted through that category's SI base unit
 * (metre, square metre, cubic metre, newton, newton-metre, pascal,
 * kilogram per cubic metre, and kilogram respectively).
 */
export class UnitConverter {
  private static readonly factors: Record<UnitCategory, Record<string, number>> = {
    length: {
      mm: 1e3,
      cm: 1e2,
      m: 1,
      in: 39.370078740157,
      ft: 3.2808398950131,
    },
    force: {
      N: 1,
      kN: 1e-3,
      MN: 1e-6,
      lb: 0.224809,
      kip: 0.224809e-3,
      tonf: 0.101972e-3,
    },
    area: {
      'mm²': 1e6,
      'cm²': 1e4,
      'm²': 1,
      'in²': 1550.0031000062,
      'ft²': 10.76391041671,
    },
    volume: {
      'mm³': 1e9,
      'cm³': 1e6,
      l: 1000,
      'm³': 1,
      'in³': 61023.744094732,
      'ft³': 35.314666721489,
    },
    moment: {
      'N m': 1,
      'kN m': 1e-3,
      'N mm': 1e3,
      'lbf ft': 0.73756,
      'kip ft': 0.73756e-3,
    },
    stress: {
      Pa: 1,
      kPa: 1e-3,
      MPa: 1e-6,
      GPa: 1e-9,
      psi: 0.00014503773773020923,
      ksi: 0.14503773773020923,
    },
    density: {
      'kg/m³': 1,
      't/m³': 1e-3,
      'lb/ft³': 0.0624279606,
    },
    mass: {
      g: 1e3,
      kg: 1,
      t: 1e-3,
      lb: 2.2046226218488,
    },
  };

  public static ConvertForce(value: number, unit: string): number {
    const conversionFactor = this.factors['force'][unit];
    if (conversionFactor === undefined) {
      throw new Error(`Unsupported conversion to unit: ${unit} for category: force.`);
    }
    return value * conversionFactor;
  }

  public static ConvertLength(value: number, unit: string): number {
    const conversionFactor = this.factors['length'][unit];
    if (conversionFactor === undefined) {
      throw new Error(`Unsupported conversion to unit: ${unit} for category: length.`);
    }
    return value * conversionFactor;
  }

  public static ConvertMoment(value: number, units: UnitPair): number {
    const forceConversionFactor = this.factors['force'][units[0]];
    const lengthConversionFactor = this.factors['length'][units[1]];
    if (lengthConversionFactor === undefined || forceConversionFactor === undefined) {
      throw new Error(`Unsupported conversion to units: ${units} for category: moment.`);
    }
    return value * lengthConversionFactor * forceConversionFactor;
  }
}
