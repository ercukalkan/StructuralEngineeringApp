export default interface PointInternalForces {
  location: number;
  internalForces: {
    axial: number;
    shear: number;
    moment: number;
  };
}
