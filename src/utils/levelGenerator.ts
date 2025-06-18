
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

// Generate a solvable path through the grid with gaps between numbered cells
const generateSolvablePathWithGaps = (gridSize: number, numberCount: number): Array<[number, number]> => {
  const totalCells = gridSize * gridSize;
  const minPathLength = Math.max(numberCount * 2, Math.floor(totalCells * 0.4)); // Ensure reasonable path length
  const maxPathLength = Math.floor(totalCells * 0.7); // Don't fill more than 70% of grid
  
  const pathLength = Math.min(maxPathLength, Math.max(minPathLength, numberCount + Math.floor(Math.random() * 10)));
  
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

// Select positions for numbered cells with gaps
const selectNumberedPositions = (path: Array<[number, number]>, numberCount: number): number[] => {
  if (path.length < numberCount) return [];
  
  const positions: number[] = [];
  const minGap = Math.max(1, Math.floor(path.length / (numberCount + 1)));
  
  // Always include the first position
  positions.push(0);
  
  // Distribute remaining numbers with random gaps
  for (let i = 1; i < numberCount; i++) {
    const minPos = positions[i - 1] + minGap;
    const maxPos = Math.min(path.length - (numberCount - i), path.length - 1);
    
    if (minPos >= maxPos) {
      // If we can't fit more numbers with gaps, place them consecutively
      positions.push(Math.min(positions[i - 1] + 1, path.length - 1));
    } else {
      // Random position within valid range
      const randomPos = minPos + Math.floor(Math.random() * (maxPos - minPos + 1));
      positions.push(randomPos);
    }
  }
  
  return positions;
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
  
  // Generate a solvable path with more cells than numbers
  const solutionPath = generateSolvablePathWithGaps(gridSize, numberOfNumbers);
  
  // Select positions for numbered cells with gaps
  const numberedPositions = selectNumberedPositions(solutionPath, numberOfNumbers);
  
  // Place numbered cells at selected positions
  const numberedCells: NumberedCell[] = numberedPositions.map((pathIndex, numberIndex) => ({
    row: solutionPath[pathIndex][0],
    col: solutionPath[pathIndex][1],
    number: numberIndex + 1
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
  
  // Generate a solvable path with gaps
  const solutionPath = generateSolvablePathWithGaps(gridSize, numCount);
  
  // Select positions for numbered cells with gaps
  const numberedPositions = selectNumberedPositions(solutionPath, numCount);
  
  // Place numbered cells at selected positions
  const numberedCells: NumberedCell[] = numberedPositions.map((pathIndex, numberIndex) => ({
    row: solutionPath[pathIndex][0],
    col: solutionPath[pathIndex][1],
    number: numberIndex + 1
  }));

  return {
    gridSize,
    numberedCells,
    difficulty
  };
};
