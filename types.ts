
export interface RingState {
  rotation: number;
  segments: number;
  symbols: string[];
}

export interface GameState {
  inner: RingState;
  innerMid: RingState;
  middle: RingState;
  outerMid: RingState;
  outer: RingState;
  isSolved: boolean;
  secretMessage: string;
  hint: string;
}

export enum RingLayer {
  INNER = 'inner',
  INNER_MID = 'innerMid',
  MIDDLE = 'middle',
  OUTER_MID = 'outerMid',
  OUTER = 'outer'
}
