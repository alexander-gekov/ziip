export interface NumberedCell {
  row: number;
  col: number;
  number: number;
}

export interface Wall {
  cell1: [number, number];
  cell2: [number, number];
}

export interface Level {
  gridSize: number;
  numberedCells: NumberedCell[];
  difficulty: "easy" | "medium" | "hard";
  solutionPath: Array<[number, number]>;
  seed: number;
  walls: Wall[];
}

type DifficultyConfig = {
  gridSize: number;
  minDotCount: number;
  maxDotCount: number;
  minSpacing: number;
  retryAttempts: number;
  wallCount: number;
  wallProbability: number;
  difficulty: "easy" | "medium" | "hard";
};

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> =
  {
    easy: {
      gridSize: 6,
      minDotCount: 3,
      maxDotCount: 7,
      minSpacing: 2,
      retryAttempts: 100,
      wallCount: 4,
      wallProbability: 0.2,
      difficulty: "easy",
    },
    medium: {
      gridSize: 8,
      minDotCount: 4,
      maxDotCount: 8,
      minSpacing: 4,
      retryAttempts: 100,
      wallCount: 9,
      wallProbability: 0.4,
      difficulty: "medium",
    },
    hard: {
      gridSize: 10,
      minDotCount: 7,
      maxDotCount: 7,
      minSpacing: 8,
      retryAttempts: 100,
      wallCount: 16,
      wallProbability: 0.5,
      difficulty: "hard",
    },
  };

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

const key = ([r, c]: [number, number]) => `${r},${c}`;

const shuffleInPlace = <T>(arr: T[], rnd: SeededRandom) => {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = rnd.nextInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getUnvisitedNeighbors = (
  current: [number, number],
  gridSize: number,
  visited: Set<string>,
  walls: Wall[] = [],
  preferredDirection?: "horizontal" | "vertical"
): Array<[number, number]> => {
  const [row, col] = current;
  const neighbors: Array<[number, number]> = [];

  let directions: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  if (preferredDirection === "horizontal") {
    directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
  } else if (preferredDirection === "vertical") {
    directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
  }

  const hasWallBetween = (
    cell1: [number, number],
    cell2: [number, number]
  ): boolean => {
    return walls.some(
      (wall) =>
        (wall.cell1[0] === cell1[0] &&
          wall.cell1[1] === cell1[1] &&
          wall.cell2[0] === cell2[0] &&
          wall.cell2[1] === cell2[1]) ||
        (wall.cell1[0] === cell2[0] &&
          wall.cell1[1] === cell2[1] &&
          wall.cell2[0] === cell1[0] &&
          wall.cell2[1] === cell1[1])
    );
  };

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (
      newRow >= 0 &&
      newRow < gridSize &&
      newCol >= 0 &&
      newCol < gridSize &&
      !visited.has(`${newRow},${newCol}`) &&
      !hasWallBetween([row, col], [newRow, newCol])
    ) {
      neighbors.push([newRow, newCol]);
    }
  }

  return neighbors;
};

const generateHamiltonianPath = (
  gridSize: number,
  rnd: SeededRandom,
  maxRetries: number = 1000
): Array<[number, number]> | null => {
  const total = gridSize * gridSize;
  const visited = new Set<string>();
  const neighborCounts = new Map<string, number>();

  const getNeighborCount = (pos: [number, number]): number => {
    const posKey = key(pos);
    if (!neighborCounts.has(posKey)) {
      neighborCounts.set(
        posKey,
        getUnvisitedNeighbors(pos, gridSize, visited, []).length
      );
    }
    return neighborCounts.get(posKey)!;
  };

  const clearNeighborCache = (pos: [number, number]) => {
    const [row, col] = pos;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize
      ) {
        neighborCounts.delete(key([newRow, newCol]));
      }
    }
    neighborCounts.delete(key(pos));
  };

  const start: [number, number] = [
    rnd.nextInt(0, gridSize - 1),
    rnd.nextInt(0, gridSize - 1),
  ];
  const path: Array<[number, number]> = [start];
  visited.add(key(start));

  let retries = 0;

  const dfs = (current: [number, number]): boolean => {
    if (retries >= maxRetries) return false;
    if (path.length === total) return true;

    const neighbors = getUnvisitedNeighbors(current, gridSize, visited, []);

    if (neighbors.length === 0 && path.length < total) {
      return false;
    }

    shuffleInPlace(neighbors, rnd);
    neighbors.sort((a, b) => {
      const countDiff = getNeighborCount(a) - getNeighborCount(b);
      return countDiff === 0 ? rnd.next() - 0.5 : countDiff;
    });

    for (const nxt of neighbors) {
      visited.add(key(nxt));
      path.push(nxt);
      clearNeighborCache(nxt);

      if (dfs(nxt)) return true;

      visited.delete(key(nxt));
      path.pop();
      clearNeighborCache(nxt);
      retries++;
    }

    return false;
  };

  if (dfs(start)) return path;

  return null;
};

const isGoodCheckpointPosition = (
  pos: [number, number],
  last: [number, number],
  min: number
) => Math.abs(pos[0] - last[0]) + Math.abs(pos[1] - last[1]) >= min;

const selectCheckpoints = (
  path: Array<[number, number]>,
  dotCount: number,
  minSpacing: number
): Array<[number, number]> => {
  const checkpoints: Array<[number, number]> = [path[0]];
  const pathLength = path.length;
  const step = Math.floor(pathLength / (dotCount - 1));

  for (let i = 1; i < dotCount - 1; i++) {
    let pos = path[i * step];
    let offset = 0;
    let found = false;

    while (offset < step && !found) {
      if (isGoodCheckpointPosition(pos, checkpoints[i - 1], minSpacing)) {
        checkpoints.push(pos);
        found = true;
      } else {
        offset++;
        pos = path[i * step + offset];
      }
    }

    if (!found) {
      checkpoints.push(pos);
    }
  }

  checkpoints.push(path[pathLength - 1]);
  return checkpoints;
};

const isUniqueSolution = (
  gridSize: number,
  checkpoints: Array<[number, number]>,
  walls: Wall[] = []
): boolean => {
  const visited = new Set<string>();
  let solutionCount = 0;

  const dfs = (pos: [number, number], targetIdx: number) => {
    if (solutionCount > 1) return;

    if (
      pos[0] === checkpoints[targetIdx][0] &&
      pos[1] === checkpoints[targetIdx][1]
    ) {
      if (targetIdx === checkpoints.length - 1) {
        solutionCount++;
        return;
      }
      targetIdx++;
    }

    const neighbors = getUnvisitedNeighbors(pos, gridSize, visited, walls);
    for (const nxt of neighbors) {
      visited.add(key(nxt));
      dfs(nxt, targetIdx);
      visited.delete(key(nxt));
    }
  };

  visited.add(key(checkpoints[0]));
  dfs(checkpoints[0], 1);

  return solutionCount === 1;
};

const generateWalls = (
  gridSize: number,
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[],
  config: DifficultyConfig,
  rnd: SeededRandom
): Wall[] => {
  const walls: Wall[] = [];
  const solutionPathSet = new Set(solutionPath.map(key));

  const wouldBlockSolution = (
    cell1: [number, number],
    cell2: [number, number]
  ): boolean => {
    const cell1Key = key(cell1);
    const cell2Key = key(cell2);

    for (let i = 0; i < solutionPath.length - 1; i++) {
      const currentKey = key(solutionPath[i]);
      const nextKey = key(solutionPath[i + 1]);

      if (
        (currentKey === cell1Key && nextKey === cell2Key) ||
        (currentKey === cell2Key && nextKey === cell1Key)
      ) {
        return true;
      }
    }

    return false;
  };

  const wouldBlockNumberedCell = (
    cell1: [number, number],
    cell2: [number, number]
  ): boolean => {
    const isNumberedCell = (pos: [number, number]): boolean => {
      return numberedCells.some((nc) => nc.row === pos[0] && nc.col === pos[1]);
    };

    return isNumberedCell(cell1) || isNumberedCell(cell2);
  };

  const potentialWalls: Array<[number, number, number, number]> = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (col < gridSize - 1) {
        potentialWalls.push([row, col, row, col + 1]);
      }
      if (row < gridSize - 1) {
        potentialWalls.push([row, col, row + 1, col]);
      }
    }
  }

  shuffleInPlace(potentialWalls, rnd);

  let wallsAdded = 0;
  for (const [row1, col1, row2, col2] of potentialWalls) {
    if (wallsAdded >= config.wallCount) break;

    const cell1: [number, number] = [row1, col1];
    const cell2: [number, number] = [row2, col2];

    if (
      !wouldBlockSolution(cell1, cell2) &&
      !wouldBlockNumberedCell(cell1, cell2) &&
      rnd.next() < config.wallProbability
    ) {
      const testWalls = [...walls, { cell1, cell2 }];
      if (isUniqueSolution(gridSize, solutionPath, testWalls)) {
        walls.push({ cell1, cell2 });
        wallsAdded++;
      }
    }
  }

  return walls;
};

export const generateLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium",
  seed?: number,
  maxAttempts: number = 5
): Level => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const finalSeed = seed ?? Math.floor(Math.random() * 1000000);
  const rnd = new SeededRandom(finalSeed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const path = generateHamiltonianPath(config.gridSize, rnd);
    if (!path) continue;

    const dotCount = rnd.nextInt(config.minDotCount, config.maxDotCount);
    const checkpoints = selectCheckpoints(path, dotCount, config.minSpacing);

    const numberedCells: NumberedCell[] = checkpoints.map((pos, idx) => ({
      row: pos[0],
      col: pos[1],
      number: idx + 1,
    }));

    const walls = generateWalls(
      config.gridSize,
      path,
      numberedCells,
      config,
      rnd
    );

    return {
      gridSize: config.gridSize,
      numberedCells,
      difficulty,
      solutionPath: path,
      seed: finalSeed,
      walls,
    };
  }

  throw new Error(
    `Failed to generate a valid level after ${maxAttempts} attempts`
  );
};

export const generateDailyLevel = (): Level => {
  const date = new Date();
  const seed =
    date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
  return generateLevel("medium", seed);
};

export const generateRandomLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium"
): Level => {
  return generateLevel(difficulty);
};
