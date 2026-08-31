export default interface SupportReaction {
  location: number;
  reactions: {
    axial: number;
    shear: number;
    moment: number;
  };
}
