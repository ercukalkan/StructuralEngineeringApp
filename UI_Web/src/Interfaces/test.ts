export interface AnalysisRequest {
  length: number;
  elements: number;
  uniformLoad: number;
}

export interface AnalysisResponse {
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
  points?: Points[];
  supportReactions: {
    left: {
      vertical: number;
      horizontal: number;
      moment: number;
    };
    right: {
      vertical: number;
      horizontal: number;
      moment: number;
    };
  };
  plot?: {
    format: string;
    dataUrl: string;
  };
}

interface Points {
  x: number;
  axial: number;
  shear: number;
  moment: number;
}
