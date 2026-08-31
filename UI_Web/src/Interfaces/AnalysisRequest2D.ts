import PointLoad from './PointLoad';
import Support from './Support';
import type { UnitPair } from '../Types/UnitPair';

export default interface AnalysisRequest2D {
  length: number | null;
  elements: number | null;
  uniformLoad: number | null;
  pointLoads: PointLoad[] | null;
  supports: Support[] | null;
  inputUnits: UnitPair | null;
}
