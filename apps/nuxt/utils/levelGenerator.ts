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

const generateWalls = (
  gridSize: number,
  solutionPath: Array<[number, number]>,
  numberedCells: NumberedCell[],
  config: DifficultyConfig,
  rnd: SeededRandom
): Wall[] => {
  const walls: Wall[] = [];
  const solutionPathSet = new Set(solutionPath.map(([r, c]) => `${r},${c}`));
  const numberedCellsSet = new Set(
    numberedCells.map((cell) => `${cell.row},${cell.col}`)
  );

  const wouldBlockSolution = (
    cell1: [number, number],
    cell2: [number, number]
  ): boolean => {
    const cell1Key = `${cell1[0]},${cell1[1]}`;
    const cell2Key = `${cell2[0]},${cell2[1]}`;
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

  const wouldBlockNumberedCell = (
    cell1: [number, number],
    cell2: [number, number]
  ): boolean => {
    return (
      numberedCellsSet.has(`${cell1[0]},${cell1[1]}`) ||
      numberedCellsSet.has(`${cell2[0]},${cell2[1]}`)
    );
  };

  let attempts = 0;
  const maxAttempts = gridSize * gridSize * 4;

  while (walls.length < config.wallCount && attempts < maxAttempts) {
    attempts++;

    if (config.difficulty === "easy" && rnd.next() > config.wallProbability) {
      continue;
    }

    const row = rnd.nextInt(0, gridSize - 1);
    const col = rnd.nextInt(0, gridSize - 1);

    const direction = rnd.nextInt(0, 2);

    if (direction < 1 && col < gridSize - 1) {
      const cell1: [number, number] = [row, col];
      const cell2: [number, number] = [row, col + 1];

      if (
        !wouldBlockSolution(cell1, cell2) &&
        !wouldBlockNumberedCell(cell1, cell2)
      ) {
        const wall = { cell1, cell2 };
        if (
          !walls.some(
            (w) =>
              (w.cell1[0] === wall.cell1[0] &&
                w.cell1[1] === wall.cell1[1] &&
                w.cell2[0] === wall.cell2[0] &&
                w.cell2[1] === wall.cell2[1]) ||
              (w.cell1[0] === wall.cell2[0] &&
                w.cell1[1] === wall.cell2[1] &&
                w.cell2[0] === wall.cell1[0] &&
                w.cell2[1] === wall.cell1[1])
          )
        ) {
          walls.push(wall);
        }
      }
    } else if (direction >= 1 && row < gridSize - 1) {
      const cell1: [number, number] = [row, col];
      const cell2: [number, number] = [row + 1, col];

      if (
        !wouldBlockSolution(cell1, cell2) &&
        !wouldBlockNumberedCell(cell1, cell2)
      ) {
        const wall = { cell1, cell2 };
        if (
          !walls.some(
            (w) =>
              (w.cell1[0] === wall.cell1[0] &&
                w.cell1[1] === wall.cell1[1] &&
                w.cell2[0] === wall.cell2[0] &&
                w.cell2[1] === wall.cell2[1]) ||
              (w.cell1[0] === wall.cell2[0] &&
                w.cell1[1] === wall.cell2[1] &&
                w.cell2[0] === wall.cell1[0] &&
                w.cell2[1] === wall.cell1[1])
          )
        ) {
          walls.push(wall);
        }
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
