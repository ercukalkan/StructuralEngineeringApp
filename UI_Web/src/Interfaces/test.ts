export interface AnalysisResponse {
  result: {
    units: {
      length: string;
      force: string;
      moment: string;
    };
    beam: {
      length: number;
      elements: number;
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
  };
}

interface Points {
  x: number;
  axial: number;
  shear: number;
  moment: number;
}
