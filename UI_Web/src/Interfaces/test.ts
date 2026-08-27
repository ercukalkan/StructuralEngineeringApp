export interface AnalysisRequest {
  length: number;
  elements: number;
  uniformLoad: number;
  supports?: Array<{
    location: number;
    degreesOfFreedom: {
      N: boolean;
      V: boolean;
      M: boolean;
    };
  }>;
}

export interface SupportReactionEntry {
  location: number;
  reactions: {
    vertical: number;
    horizontal: number;
    moment: number;
  };
}

export interface LegacySupportReactions {
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
  supportReactions: SupportReactionEntry[] | LegacySupportReactions;
  plot: {
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
