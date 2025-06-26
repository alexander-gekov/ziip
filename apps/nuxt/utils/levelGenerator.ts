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

type PathPattern =
  | "symmetrical"
  | "spiral"
  | "zigzag"
  | "corners"
  | "random"
  | "meandering";

interface DifficultyConfig {
  gridSize: number;
  minDotCount: number;
  maxDotCount: number;
  minSpacing: number;
  retryAttempts: number;
  minWallCount: number;
  maxWallCount: number;
  wallProbability: number;
  difficulty: "easy" | "medium" | "hard";
  preferredPattern: PathPattern;
}

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> =
  {
    easy: {
      gridSize: 6,
      minDotCount: 3,
      maxDotCount: 9,
      minSpacing: 2,
      retryAttempts: 100,
      minWallCount: 8,
      maxWallCount: 18,
      wallProbability: 0.8,
      difficulty: "easy",
      preferredPattern: "symmetrical",
    },
    medium: {
      gridSize: 8,
      minDotCount: 4,
      maxDotCount: 8,
      minSpacing: 4,
      retryAttempts: 100,
      minWallCount: 14,
      maxWallCount: 18,
      wallProbability: 0.75,
      difficulty: "medium",
      preferredPattern: "meandering",
    },
    hard: {
      gridSize: 10,
      minDotCount: 7,
      maxDotCount: 7,
      minSpacing: 8,
      retryAttempts: 100,
      minWallCount: 22,
      maxWallCount: 28,
      wallProbability: 0.9,
      difficulty: "hard",
      preferredPattern: "meandering",
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

// Helper function to get the symmetrical position in the grid
const getSymmetricalPosition = (
  pos: [number, number],
  gridSize: number,
  type: "horizontal" | "vertical" | "diagonal" = "horizontal"
): [number, number] => {
  const [row, col] = pos;
  switch (type) {
    case "horizontal":
      return [row, gridSize - 1 - col];
    case "vertical":
      return [gridSize - 1 - row, col];
    case "diagonal":
      return [col, row];
    default:
      return pos;
  }
};

// Modified getUnvisitedNeighbors to support symmetrical paths
const getUnvisitedNeighbors = (
  current: [number, number],
  gridSize: number,
  visited: Set<string>,
  walls: Wall[] = [],
  pattern: PathPattern = "meandering",
  pathLength: number = 0
): Array<[number, number]> => {
  const [row, col] = current;
  let directions: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // Adjust direction priorities based on pattern
  switch (pattern) {
    case "symmetrical":
      // For symmetrical paths, prioritize moves that have available symmetrical counterparts
      const symmetricalNeighbors: Array<[number, number]> = [];
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (
          newRow >= 0 &&
          newRow < gridSize &&
          newCol >= 0 &&
          newCol < gridSize
        ) {
          const symPos = getSymmetricalPosition([newRow, newCol], gridSize);
          if (
            symPos[0] >= 0 &&
            symPos[0] < gridSize &&
            symPos[1] >= 0 &&
            symPos[1] < gridSize &&
            !visited.has(`${symPos[0]},${symPos[1]}`)
          ) {
            symmetricalNeighbors.push([dr, dc]);
          }
        }
      }
      if (symmetricalNeighbors.length > 0) {
        directions = symmetricalNeighbors;
      }
      break;
    case "meandering":
      // For meandering paths, we want to encourage longer straight lines
      // and smooth turns, similar to the LinkedIn puzzle
      const lastDirection = pathLength > 0 ? getLastDirection(visited) : null;
      if (lastDirection) {
        // Prioritize continuing in the same direction
        directions = [
          lastDirection,
          ...getPerpendicularDirections(lastDirection),
          getOppositeDirection(lastDirection),
        ];
      }
      break;
    case "spiral":
      // Prioritize clockwise movement
      directions = [
        [0, 1], // right
        [1, 0], // down
        [0, -1], // left
        [-1, 0], // up
      ];
      break;
    case "zigzag":
      // Alternate between horizontal and vertical movement
      if (pathLength % 2 === 0) {
        directions = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ];
      } else {
        directions = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
      }
      break;
    case "corners":
      // Prioritize moving towards corners
      const distToCorner = Math.min(
        row,
        col,
        gridSize - 1 - row,
        gridSize - 1 - col
      );
      if (distToCorner <= 2) {
        directions = [
          [row === 0 ? 1 : -1, 0],
          [0, col === 0 ? 1 : -1],
        ];
      }
      break;
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

  const neighbors: Array<[number, number]> = [];
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

      // For symmetrical patterns, also add the symmetrical position if available
      if (pattern === "symmetrical") {
        const symPos = getSymmetricalPosition([newRow, newCol], gridSize);
        if (
          symPos[0] >= 0 &&
          symPos[0] < gridSize &&
          symPos[1] >= 0 &&
          symPos[1] < gridSize &&
          !visited.has(`${symPos[0]},${symPos[1]}`) &&
          !hasWallBetween([row, col], symPos)
        ) {
          neighbors.push(symPos);
        }
      }
    }
  }

  return neighbors;
};

// Helper function to get the last movement direction
const getLastDirection = (visited: Set<string>): [number, number] => {
  const visitedArray = Array.from(visited).map((pos) =>
    pos.split(",").map(Number)
  );
  if (visitedArray.length < 2) return [0, 1]; // Default direction

  const last = visitedArray[visitedArray.length - 1];
  const secondLast = visitedArray[visitedArray.length - 2];
  return [last[0] - secondLast[0], last[1] - secondLast[1]];
};

// Helper function to get perpendicular directions
const getPerpendicularDirections = (
  dir: [number, number]
): Array<[number, number]> => {
  if (dir[0] === 0) {
    // If moving horizontally, return vertical directions
    return [
      [-1, 0],
      [1, 0],
    ];
  } else {
    // If moving vertically, return horizontal directions
    return [
      [0, -1],
      [0, 1],
    ];
  }
};

// Helper function to get opposite direction
const getOppositeDirection = (dir: [number, number]): [number, number] => {
  return [-dir[0], -dir[1]];
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

      path.pop();
      visited.delete(key(nxt));
      clearNeighborCache(nxt);
      retries++;
    }

    return false;
  };

  const result = dfs(start);
  return result ? path : null;
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
  const cps: Array<[number, number]> = [path[0]];
  const seg = Math.floor(path.length / (dotCount - 1));

  for (let i = 1; i < dotCount - 1; ++i) {
    let idx = i * seg;
    while (
      idx < path.length - 1 &&
      !isGoodCheckpointPosition(path[idx], cps[cps.length - 1], minSpacing)
    )
      ++idx;
    cps.push(path[idx]);
  }
  cps.push(path[path.length - 1]);
  return cps;
};

const isUniqueSolution = (
  gridSize: number,
  checkpoints: Array<[number, number]>,
  walls: Wall[] = []
): boolean => {
  const visited = new Set<string>();
  let count = 0;

  const dfs = (pos: [number, number], targetIdx: number) => {
    if (count > 1) return;

    const target = checkpoints[targetIdx];
    if (pos[0] === target[0] && pos[1] === target[1]) {
      if (++targetIdx === checkpoints.length) {
        ++count;
        return;
      }
    }

    const moves = getUnvisitedNeighbors(pos, gridSize, visited, walls);
    for (const nxt of moves) {
      visited.add(key(nxt));
      dfs(nxt, targetIdx);
      visited.delete(key(nxt));
      if (count > 1) return;
    }
  };

  visited.add(key(checkpoints[0]));
  dfs(checkpoints[0], 0);
  return count === 1;
};

// Modified generateWalls for meandering paths
const generateWalls = (
  gridSize: number,
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[],
  config: DifficultyConfig,
  rnd: SeededRandom
): Wall[] => {
  // First, determine if this level should have walls at all
  if (rnd.next() > config.wallProbability) {
    return [];
  }

  const walls: Wall[] = [];
  const solutionPathSet = new Set(solutionPath.map(([r, c]) => `${r},${c}`));

  // Calculate target wall count within the min-max range
  const targetWallCount = rnd.nextInt(config.minWallCount, config.maxWallCount);

  // For meandering patterns, we want to create walls that guide the path
  if (config.preferredPattern === "meandering") {
    // Create parallel walls along the solution path
    for (let i = 1; i < solutionPath.length - 1; i++) {
      const prev = solutionPath[i - 1];
      const curr = solutionPath[i];
      const next = solutionPath[i + 1];

      // Determine the direction of movement
      const direction = [curr[0] - prev[0], curr[1] - prev[1]];

      // Add walls perpendicular to the path direction
      if (direction[0] === 0) {
        // Moving horizontally
        // Add vertical walls above and below
        addParallelWalls(
          curr,
          [1, 0],
          gridSize,
          walls,
          solutionPath,
          numberedCells
        );
      } else {
        // Moving vertically
        // Add horizontal walls to the sides
        addParallelWalls(
          curr,
          [0, 1],
          gridSize,
          walls,
          solutionPath,
          numberedCells
        );
      }

      // At turns, add corner walls
      if (
        i < solutionPath.length - 1 &&
        (prev[0] !== next[0] || prev[1] !== next[1])
      ) {
        addCornerWalls(
          prev,
          curr,
          next,
          gridSize,
          walls,
          solutionPath,
          numberedCells
        );
      }

      // Break early if we've exceeded the max wall count
      if (walls.length >= targetWallCount) break;
    }
  }

  // Fill in remaining walls to reach the target wall count
  let attempts = 0;
  const maxAttempts = gridSize * gridSize * 4; // Prevent infinite loops

  while (walls.length < targetWallCount && attempts < maxAttempts) {
    attempts++;

    const row = rnd.nextInt(0, gridSize - 1);
    const col = rnd.nextInt(0, gridSize - 1);
    const direction = rnd.nextInt(0, 2);

    if (direction === 0 && col < gridSize - 1) {
      tryAddWall(
        [row, col],
        [row, col + 1],
        walls,
        solutionPath,
        numberedCells
      );
    } else if (row < gridSize - 1) {
      tryAddWall(
        [row, col],
        [row + 1, col],
        walls,
        solutionPath,
        numberedCells
      );
    }
  }

  return walls;
};

// Helper function to add parallel walls along the path
const addParallelWalls = (
  curr: [number, number],
  direction: [number, number],
  gridSize: number,
  walls: Wall[],
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[]
) => {
  const offsets = direction[0] === 0 ? [-1, 1] : [-1, 1];

  for (const offset of offsets) {
    const newRow = curr[0] + direction[0] * offset;
    const newCol = curr[1] + direction[1] * offset;

    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      tryAddWall(
        [curr[0], curr[1]],
        [newRow, newCol],
        walls,
        solutionPath,
        numberedCells
      );
    }
  }
};

// Helper function to add corner walls
const addCornerWalls = (
  prev: [number, number],
  curr: [number, number],
  next: [number, number],
  gridSize: number,
  walls: Wall[],
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[]
) => {
  const direction1 = [curr[0] - prev[0], curr[1] - prev[1]];
  const direction2 = [next[0] - curr[0], next[1] - curr[1]];

  // Add a wall in the outer corner
  const cornerRow = curr[0] + direction1[0] + direction2[0];
  const cornerCol = curr[1] + direction1[1] + direction2[1];

  if (
    cornerRow >= 0 &&
    cornerRow < gridSize &&
    cornerCol >= 0 &&
    cornerCol < gridSize
  ) {
    tryAddWall(
      [curr[0] + direction1[0], curr[1] + direction1[1]],
      [cornerRow, cornerCol],
      walls,
      solutionPath,
      numberedCells
    );
  }
};

// Helper function to try adding a wall if it's valid
const tryAddWall = (
  cell1: [number, number],
  cell2: [number, number],
  walls: Wall[],
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[]
) => {
  if (
    !wouldBlockSolution(cell1, cell2, solutionPath) &&
    !wouldBlockNumberedCell(cell1, cell2, numberedCells) &&
    !wallExists(walls, cell1, cell2)
  ) {
    walls.push({ cell1, cell2 });
  }
};

// Helper function to check if a wall already exists
const wallExists = (
  walls: Wall[],
  cell1: [number, number],
  cell2: [number, number]
): boolean => {
  return walls.some(
    (w) =>
      (w.cell1[0] === cell1[0] &&
        w.cell1[1] === cell1[1] &&
        w.cell2[0] === cell2[0] &&
        w.cell2[1] === cell2[1]) ||
      (w.cell1[0] === cell2[0] &&
        w.cell1[1] === cell2[1] &&
        w.cell2[0] === cell1[0] &&
        w.cell2[1] === cell1[1])
  );
};

// Helper function to check if a wall would block the solution path
const wouldBlockSolution = (
  cell1: [number, number],
  cell2: [number, number],
  solutionPath: Array<[number, number]>
): boolean => {
  const cell1Key = `${cell1[0]},${cell1[1]}`;
  const cell2Key = `${cell2[0]},${cell2[1]}`;
  const solutionPathSet = new Set(solutionPath.map(([r, c]) => `${r},${c}`));

  if (!solutionPathSet.has(cell1Key) || !solutionPathSet.has(cell2Key)) {
    return false;
  }

  const pos1 = solutionPath.findIndex(
    ([r, c]) => r === cell1[0] && c === cell1[1]
  );
  const pos2 = solutionPath.findIndex(
    ([r, c]) => r === cell2[0] && c === cell2[1]
  );

  return Math.abs(pos1 - pos2) === 1;
};

// Helper function to check if a wall would block a numbered cell
const wouldBlockNumberedCell = (
  cell1: [number, number],
  cell2: [number, number],
  numberedCells: NumberedCell[]
): boolean => {
  const numberedCellsSet = new Set(
    numberedCells.map((cell) => `${cell.row},${cell.col}`)
  );
  return (
    numberedCellsSet.has(`${cell1[0]},${cell1[1]}`) ||
    numberedCellsSet.has(`${cell2[0]},${cell2[1]}`)
  );
};

export const generateLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium",
  seed?: number,
  maxAttempts: number = 5
): Level => {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  let realSeed = seed ?? Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const rnd = new SeededRandom(realSeed);
      const path = generateHamiltonianPath(cfg.gridSize, rnd, 1000);

      if (!path) {
        attempts++;
        realSeed = Date.now();
        continue;
      }

      const dotCount = rnd.nextInt(cfg.minDotCount, cfg.maxDotCount);
      const spacing = Math.floor((path.length - 1) / (dotCount - 1));
      const numberedPath = Array.from(
        { length: dotCount - 1 },
        (_, i) => path[i * spacing]
      ).concat([path[path.length - 1]]);

      const numberedCells = numberedPath.map(([r, c], i) => ({
        row: r,
        col: c,
        number: i + 1,
      }));

      const walls = generateWalls(cfg.gridSize, path, numberedCells, cfg, rnd);

      return {
        gridSize: cfg.gridSize,
        numberedCells,
        solutionPath: path,
        difficulty,
        seed: realSeed,
        walls,
      };
    } catch (error) {
      attempts++;
      realSeed = Date.now();

      if (attempts >= maxAttempts) {
        throw new Error(
          `Failed to generate level after ${maxAttempts} attempts`
        );
      }
    }
  }

  throw new Error(`Failed to generate level after ${maxAttempts} attempts`);
};

export const generateDailyLevel = (): Level => {
  const today = new Date();
  const seed =
    today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
  return generateLevel("easy", seed);
};

export const generateRandomLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium"
): Level => {
  return generateLevel(difficulty);
};
