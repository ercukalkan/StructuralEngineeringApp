import SupportReaction from './SupportReaction';
import PointInternalForces from './PointInternalForces';

export default interface AnalysisResponse2D {
  units: {
    length: string;
    force: string;
    moment: string;
  };
  beam: {
    length: number;
    elements: number;
    distributedLoad: {
      magnitude: number;
      startPosition: number;
      endPosition: number;
    };
  };
  points?: PointInternalForces[];
  supportReactions: SupportReaction[];
  plot: {
    format: string;
    dataUrl: string;
  };
}
