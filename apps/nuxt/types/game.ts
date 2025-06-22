export interface Cell {
  id: string;
  row: number;
  col: number;
  isNumbered: boolean;
  number?: number;
  isFilled: boolean;
  isPath: boolean;
  isConnected: boolean;
  isHighlighted?: boolean;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface GameState {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  isComplete: boolean;
  moves: number;
  hintsUsed: number;
  solutionPath: Array<[number, number]>;
}
