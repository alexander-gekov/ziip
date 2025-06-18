
export interface NumberedCell {
  row: number;
  col: number;
  number: number;
}

export interface Level {
  gridSize: number;
  numberedCells: NumberedCell[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const generateDailyLevel = (): Level => {
  // Generate a deterministic level based on current date
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
  
  // Simple random number generator with seed
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
  };

  const gridSize = 6; // Fixed 6x6 grid like in the image
  
  // Generate numbered cells in a pattern that creates a solvable puzzle
  const numberedCells: NumberedCell[] = [
    { row: 2, col: 1, number: 1 }, // Similar to the reference image
    { row: 4, col: 1, number: 2 },
    { row: 2, col: 2, number: 3 },
    { row: 4, col: 2, number: 4 },
    { row: 3, col: 3, number: 5 },
    { row: 1, col: 4, number: 6 },
    { row: 4, col: 4, number: 7 },
    { row: 5, col: 1, number: 8 },
    { row: 1, col: 1, number: 9 },
    { row: 1, col: 2, number: 10 },
    { row: 0, col: 2, number: 11 }
  ];

  return {
    gridSize,
    numberedCells,
    difficulty: 'medium'
  };
};

export const generateRandomLevel = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Level => {
  const gridSizes = {
    easy: 5,
    medium: 6,
    hard: 7
  };

  const numbersCount = {
    easy: 6,
    medium: 8,
    hard: 10
  };

  const gridSize = gridSizes[difficulty];
  const numCount = numbersCount[difficulty];
  
  const numberedCells: NumberedCell[] = [];
  const usedPositions = new Set<string>();

  for (let i = 1; i <= numCount; i++) {
    let row, col, posKey;
    do {
      row = Math.floor(Math.random() * gridSize);
      col = Math.floor(Math.random() * gridSize);
      posKey = `${row}-${col}`;
    } while (usedPositions.has(posKey));

    usedPositions.add(posKey);
    numberedCells.push({ row, col, number: i });
  }

  return {
    gridSize,
    numberedCells,
    difficulty
  };
};
