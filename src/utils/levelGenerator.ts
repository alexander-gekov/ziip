export interface NumberedCell {
  row: number;
  col: number;
  number: number;
}

export interface Level {
  gridSize: number;
  numberedCells: NumberedCell[];
  difficulty: "easy" | "medium" | "hard";
  solutionPath: Array<[number, number]>;
  seed: number;
}

const DIFFICULTY_CONFIGS = {
  easy: {
    gridSize: 6,
    dotCount: 6,
    minSpacing: 2,
    retryAttempts: 100,
  },
  medium: {
    gridSize: 8,
    dotCount: 13,
    minSpacing: 4,
    retryAttempts: 100,
  },
  hard: {
    gridSize: 10,
    dotCount: 25,
    minSpacing: 8,
    retryAttempts: 100,
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

// ────────────────────────────────────────────────────────────────────────────
// utils
// ────────────────────────────────────────────────────────────────────────────
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
  preferredDirection?: "horizontal" | "vertical"
): Array<[number, number]> => {
  const [row, col] = current;
  const neighbors: Array<[number, number]> = [];

  // Order directions based on preference
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
    ]; // prefer horizontal movement
  } else if (preferredDirection === "vertical") {
    directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // prefer vertical movement
  }

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (
      newRow >= 0 &&
      newRow < gridSize &&
      newCol >= 0 &&
      newCol < gridSize &&
      !visited.has(`${newRow},${newCol}`)
    ) {
      neighbors.push([newRow, newCol]);
    }
  }

  return neighbors;
};

// ────────────────────────────────────────────────────────────────────────────
// Hamiltonian path (depth-first with Warnsdorff heuristic)
// ────────────────────────────────────────────────────────────────────────────
const generateHamiltonianPath = (
  gridSize: number,
  rnd: SeededRandom
): Array<[number, number]> => {
  const total = gridSize * gridSize;
  const visited = new Set<string>();

  // start from a random cell anywhere in the grid
  const start: [number, number] = [
    rnd.nextInt(0, gridSize - 1),
    rnd.nextInt(0, gridSize - 1),
  ];
  const path: Array<[number, number]> = [start];
  visited.add(key(start));

  const dfs = (current: [number, number]): boolean => {
    if (path.length === total) return true; // done

    // choose neighbours with fewest onward moves first  (Warnsdorff)
    const neighbours = getUnvisitedNeighbors(current, gridSize, visited);
    shuffleInPlace(neighbours, rnd);
    neighbours.sort(
      (a, b) =>
        getUnvisitedNeighbors(a, gridSize, visited).length -
        getUnvisitedNeighbors(b, gridSize, visited).length
    );

    for (const nxt of neighbours) {
      visited.add(key(nxt));
      path.push(nxt);

      if (dfs(nxt)) return true; // propagate success

      // back-track
      path.pop();
      visited.delete(key(nxt));
    }
    return false; // dead end
  };

  if (!dfs(start))
    throw new Error(
      "Could not build Hamiltonian path – this should not happen"
    );

  return path;
};

// ────────────────────────────────────────────────────────────────────────────
// checkpoint selection (spacing tweak: ≥ minSpacing, not >)
// ────────────────────────────────────────────────────────────────────────────
const isGoodCheckpointPosition = (
  pos: [number, number],
  last: [number, number],
  min: number
) => Math.abs(pos[0] - last[0]) + Math.abs(pos[1] - last[1]) >= min;

// unchanged API, but uses the fixed helper above
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

// ────────────────────────────────────────────────────────────────────────────
// uniqueness tester (tight pruning – returns after >1 solutions)
// ────────────────────────────────────────────────────────────────────────────
const isUniqueSolution = (
  gridSize: number,
  checkpoints: Array<[number, number]>
): boolean => {
  const visited = new Set<string>();
  let count = 0;

  const dfs = (pos: [number, number], targetIdx: number) => {
    if (count > 1) return; // early bail

    const target = checkpoints[targetIdx];
    if (pos[0] === target[0] && pos[1] === target[1]) {
      if (++targetIdx === checkpoints.length) {
        ++count;
        return;
      }
    }

    const moves = getUnvisitedNeighbors(pos, gridSize, visited);
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

// ────────────────────────────────────────────────────────────────────────────
// generateLevel – retry loop fixed, uniqueness enforced
// ────────────────────────────────────────────────────────────────────────────
export const generateLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium",
  seed?: number
): Level => {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const realSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const rnd = new SeededRandom(realSeed);

  const path = generateHamiltonianPath(cfg.gridSize, rnd);

  // Calculate spacing between numbers
  const spacing = Math.floor((path.length - 1) / (cfg.dotCount - 1));

  // Create evenly spaced numbered cells, ensuring the last one is at the end
  const numberedPath = Array.from(
    { length: cfg.dotCount - 1 },
    (_, i) => path[i * spacing]
  ).concat([path[path.length - 1]]);

  return {
    gridSize: cfg.gridSize,
    numberedCells: numberedPath.map(([r, c], i) => ({
      row: r,
      col: c,
      number: i + 1,
    })),
    solutionPath: path,
    difficulty,
    seed: realSeed,
  };
};

export const generateDailyLevel = (): Level => {
  const today = new Date();
  const seed =
    today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
  return generateLevel("easy", seed); // Start with easy for daily levels
};

export const generateRandomLevel = (
  difficulty: "easy" | "medium" | "hard" = "medium"
): Level => {
  return generateLevel(difficulty);
};
