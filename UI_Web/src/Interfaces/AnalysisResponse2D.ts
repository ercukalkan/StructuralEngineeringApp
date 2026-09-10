import SupportReaction from './SupportReaction';
import PointInternalForces from './PointInternalForces';
import PointDisplacements from './PointDisplacements';

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
  displacements: PointDisplacements[];
  plot: {
    format: string;
    dataUrl: string;
  };
}
