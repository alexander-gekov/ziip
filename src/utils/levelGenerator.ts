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

// Helper function to get adjacent cells
const getAdjacent = (row: number, col: number, gridSize: number): Array<[number, number]> => {
  const adjacent: Array<[number, number]> = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      adjacent.push([newRow, newCol]);
    }
  }
  return adjacent;
};

// Generate a solvable path through the grid
const generateSolvablePath = (gridSize: number, pathLength: number): Array<[number, number]> => {
  const path: Array<[number, number]> = [];
  const visited = new Set<string>();
  
  // Start from a random position
  let currentRow = Math.floor(Math.random() * gridSize);
  let currentCol = Math.floor(Math.random() * gridSize);
  
  path.push([currentRow, currentCol]);
  visited.add(`${currentRow}-${currentCol}`);
  
  // Generate path by walking randomly but ensuring we don't get stuck
  while (path.length < pathLength) {
    const adjacent = getAdjacent(currentRow, currentCol, gridSize);
    const unvisited = adjacent.filter(([r, c]) => !visited.has(`${r}-${c}`));
    
    if (unvisited.length === 0) {
      // Backtrack if we get stuck
      if (path.length <= 1) break;
      path.pop();
      const lastPos = path[path.length - 1];
      currentRow = lastPos[0];
      currentCol = lastPos[1];
      continue;
    }
    
    // Choose a random unvisited adjacent cell
    const [nextRow, nextCol] = unvisited[Math.floor(Math.random() * unvisited.length)];
    path.push([nextRow, nextCol]);
    visited.add(`${nextRow}-${nextCol}`);
    currentRow = nextRow;
    currentCol = nextCol;
  }
  
  return path;
};

export const generateDailyLevel = (): Level => {
  // Generate a deterministic level based on current date
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
  
  // Simple seeded random function
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const gridSize = 6;
  // Random number count between 6-12 using seeded random
  const numberOfNumbers = Math.floor(seededRandom() * 7) + 6; // 6-12
  
  // Generate a solvable path
  const solutionPath = generateSolvablePath(gridSize, numberOfNumbers);
  
  // Place numbered cells along the solution path
  const numberedCells: NumberedCell[] = solutionPath.map((position, index) => ({
    row: position[0],
    col: position[1],
    number: index + 1
  }));

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

  const gridSize = gridSizes[difficulty];
  // Random number count between 6-12
  const numCount = Math.floor(Math.random() * 7) + 6; // 6-12
  
  // Generate a solvable path
  const solutionPath = generateSolvablePath(gridSize, numCount);
  
  // Place numbered cells along the solution path
  const numberedCells: NumberedCell[] = solutionPath.map((position, index) => ({
    row: position[0],
    col: position[1],
    number: index + 1
  }));

  return {
    gridSize,
    numberedCells,
    difficulty
  };
};
