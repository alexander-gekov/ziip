<script setup lang="ts">
import { toast } from "vue-sonner";
import {
  generateDailyLevel,
  generateRandomLevel,
  type Level,
  type NumberedCell,
} from "~/utils/levelGenerator";
import {
  generateGameColors,
  type GameColors,
} from "~/composables/useGameColors";
import GameGrid from "./GameGrid.vue";
import GameControls from "./GameControls.vue";
import GameInstructions from "./GameInstructions.vue";
import CompletionAnimation from "./CompletionAnimation.vue";
import type { Cell, GameState } from "../types/game";
import { formatTime } from "../utils/format";

// State management
const gameState = ref<GameState>({
  grid: [],
  currentPath: [],
  isDrawing: false,
  isComplete: false,
  moves: 0,
  hintsUsed: 0,
  solutionPath: [],
});

const difficulty = ref<"easy" | "medium" | "hard">("easy");
const gridSize = ref(6);
const gameHistory = ref<GameState[]>([]);
const showCompletionAnimation = ref(false);
const timeElapsed = ref(0);
const isTimerRunning = ref(false);
const gameColors = ref<GameColors>(generateGameColors());
const solutionTimeout = ref<NodeJS.Timeout | null>(null);

// Timer effect
let timerInterval: NodeJS.Timeout | null = null;
watch(
  [isTimerRunning, () => gameState.value.isComplete],
  ([running, complete]: [boolean, boolean]) => {
    if (timerInterval) clearInterval(timerInterval);
    if (running && !complete) {
      timerInterval = setInterval(() => {
        timeElapsed.value++;
      }, 1000);
    }
  }
);

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (solutionTimeout.value) clearTimeout(solutionTimeout.value);
});

// Initialize game with daily level
onMounted(() => {
  try {
    const level = generateDailyLevel();
    gridSize.value = level.gridSize;
    difficulty.value = level.difficulty;
    initializeGrid(level);
  } catch (error) {
    console.error("Failed to generate level:", error);
    // Fallback to easy level if daily generation fails
    const level = generateRandomLevel("easy");
    gridSize.value = level.gridSize;
    difficulty.value = level.difficulty;
    initializeGrid(level);
  }
});

const initializeGrid = (level: Level) => {
  const grid: Cell[][] = [];

  // Initialize grid with empty cells
  for (let row = 0; row < level.gridSize; row++) {
    const gridRow: Cell[] = [];
    for (let col = 0; col < level.gridSize; col++) {
      const cellId = `${row}-${col}`;
      const numberedCell = level.numberedCells.find(
        (nc: NumberedCell) => nc.row === row && nc.col === col
      );

      gridRow.push({
        id: cellId,
        row,
        col,
        isNumbered: !!numberedCell,
        number: numberedCell?.number,
        isFilled: false,
        isPath: false,
        isConnected: false,
        isHighlighted: false,
        walls: {
          top: false,
          right: false,
          bottom: false,
          left: false,
        },
      });
    }
    grid.push(gridRow);
  }

  // Add walls
  for (const wall of level.walls) {
    const [row1, col1] = wall.cell1;
    const [row2, col2] = wall.cell2;

    // Determine wall direction and set wall flags
    if (row1 === row2) {
      // Horizontal wall (right/left)
      if (col1 < col2) {
        grid[row1][col1].walls.right = true;
        grid[row2][col2].walls.left = true;
      } else {
        grid[row1][col1].walls.left = true;
        grid[row2][col2].walls.right = true;
      }
    } else if (col1 === col2) {
      // Vertical wall (top/bottom)
      if (row1 < row2) {
        grid[row1][col1].walls.bottom = true;
        grid[row2][col2].walls.top = true;
      } else {
        grid[row1][col1].walls.top = true;
        grid[row2][col2].walls.bottom = true;
      }
    }
  }

  gameState.value = {
    grid,
    currentPath: [],
    isDrawing: false,
    isComplete: false,
    moves: 0,
    hintsUsed: 0,
    solutionPath: level.solutionPath,
  };
  gameHistory.value = [];
  gameColors.value = generateGameColors();
};

const saveGameState = () => {
  gameHistory.value = [...gameHistory.value, { ...gameState.value }];
};

const handleMouseDown = (cellId: string) => {
  // Prevent interactions if game is complete
  if (gameState.value.isComplete) return;

  const [row, col] = cellId.split("-").map(Number);
  const cell = gameState.value.grid[row][col];

  if (!isTimerRunning.value) {
    isTimerRunning.value = true;
  }

  // If clicking on a numbered cell while not drawing, start a new path
  if (
    cell.isNumbered &&
    !gameState.value.isDrawing &&
    gameState.value.currentPath.length === 0
  ) {
    saveGameState();
    gameState.value = {
      ...gameState.value,
      currentPath: [cellId],
      isDrawing: true,
      moves: gameState.value.moves + 1,
    };
    return;
  }

  // If clicking on a numbered cell while drawing, check if it's the next number in sequence
  if (cell.isNumbered && gameState.value.isDrawing) {
    const lastCell = gameState.value.grid[row][col];
    const currentNumber = lastCell.number || 0;
    const firstCell = gameState.value.currentPath[0].split("-").map(Number);
    const startCell = gameState.value.grid[firstCell[0]][firstCell[1]];
    const startNumber = startCell.number || 0;

    // Only allow connecting to the next number in sequence
    if (currentNumber === startNumber + 1) {
      saveGameState();
      gameState.value = {
        ...gameState.value,
        currentPath: [...gameState.value.currentPath, cellId],
        isDrawing: false,
        moves: gameState.value.moves + 1,
      };
      finalizePath();
    }
    return;
  }

  // Check if clicking on any cell in the current path
  if (gameState.value.currentPath.includes(cellId)) {
    const cellIndex = gameState.value.currentPath.indexOf(cellId);
    const newPath = gameState.value.currentPath.slice(0, cellIndex + 1);

    // Update the grid to clear highlighting from removed cells
    const newGrid = gameState.value.grid.map((row: Cell[]) =>
      row.map((cell: Cell) => ({
        ...cell,
        isFilled: newPath.includes(cell.id),
        isPath: newPath.includes(cell.id),
        isHighlighted: false,
      }))
    );

    saveGameState();
    gameState.value = {
      ...gameState.value,
      grid: newGrid,
      currentPath: newPath,
      isDrawing: true,
      moves: gameState.value.moves + 1,
    };
    return;
  }

  // Check if we can continue from the last path
  if (gameState.value.currentPath.length > 0) {
    const lastCell =
      gameState.value.currentPath[gameState.value.currentPath.length - 1];
    // Only allow continuing to cells that aren't already in the path
    if (
      isAdjacent(cellId, lastCell) &&
      !gameState.value.currentPath.includes(cellId)
    ) {
      saveGameState();
      gameState.value = {
        ...gameState.value,
        currentPath: [...gameState.value.currentPath, cellId],
        isDrawing: true,
        moves: gameState.value.moves + 1,
      };
    }
  }
};

const handleMouseMove = (cellId: string) => {
  // Prevent interactions if game is complete
  if (gameState.value.isComplete || !gameState.value.isDrawing) return;

  const lastCell =
    gameState.value.currentPath[gameState.value.currentPath.length - 1];

  // Check if we're moving to an adjacent cell
  if (isAdjacent(cellId, lastCell)) {
    // Case 1: Moving to a cell that's already in our path (backtracking)
    if (gameState.value.currentPath.includes(cellId)) {
      const cellIndex = gameState.value.currentPath.indexOf(cellId);
      // Only allow backtracking if we're moving to the previous cell in the path
      if (cellIndex === gameState.value.currentPath.length - 2) {
        const newPath = gameState.value.currentPath.slice(0, cellIndex + 1);

        // Update the grid to clear highlighting from removed cells
        const newGrid = gameState.value.grid.map((row: Cell[]) =>
          row.map((cell: Cell) => ({
            ...cell,
            isFilled: newPath.includes(cell.id),
            isPath: newPath.includes(cell.id),
          }))
        );

        gameState.value = {
          ...gameState.value,
          grid: newGrid,
          currentPath: newPath,
        };
      }
    }
    // Case 2: Moving to a new cell (extending the path)
    else {
      const newPath = [...gameState.value.currentPath, cellId];
      const newGrid = gameState.value.grid.map((row: Cell[]) =>
        row.map((cell: Cell) => ({
          ...cell,
          isFilled: newPath.includes(cell.id),
          isPath: newPath.includes(cell.id),
        }))
      );

      gameState.value = {
        ...gameState.value,
        grid: newGrid,
        currentPath: newPath,
      };
    }
  }
};

const handleMouseUp = () => {
  // Prevent interactions if game is complete
  if (gameState.value.isComplete) return;

  if (gameState.value.isDrawing) {
    finalizePath();
  }
};

const handleMouseLeave = () => {
  // Prevent interactions if game is complete
  if (gameState.value.isComplete) return;

  if (gameState.value.isDrawing) {
    finalizePath();
  }
};

const isAdjacent = (cellId1: string, cellId2: string): boolean => {
  const [row1, col1] = cellId1.split("-").map(Number);
  const [row2, col2] = cellId2.split("-").map(Number);

  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);

  // First check if cells are adjacent
  const isNextTo =
    (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  if (!isNextTo) return false;

  // Then check for walls
  const cell1 = gameState.value.grid[row1][col1];
  const cell2 = gameState.value.grid[row2][col2];

  // Moving up
  if (row2 < row1) {
    return !cell1.walls.top && !cell2.walls.bottom;
  }
  // Moving down
  if (row2 > row1) {
    return !cell1.walls.bottom && !cell2.walls.top;
  }
  // Moving left
  if (col2 < col1) {
    return !cell1.walls.left && !cell2.walls.right;
  }
  // Moving right
  if (col2 > col1) {
    return !cell1.walls.right && !cell2.walls.left;
  }

  return false;
};

const finalizePath = () => {
  if (gameState.value.currentPath.length < 2) {
    gameState.value = {
      ...gameState.value,
      isDrawing: false,
    };
    return;
  }

  const newGrid = gameState.value.grid.map((row: Cell[]) =>
    row.map((cell: Cell) => ({
      ...cell,
      isFilled: gameState.value.currentPath.includes(cell.id)
        ? true
        : cell.isFilled,
      isPath: gameState.value.currentPath.includes(cell.id)
        ? true
        : cell.isPath,
      isHighlighted: false,
    }))
  );

  const isComplete = checkWinCondition(newGrid, gameState.value.currentPath);

  gameState.value = {
    ...gameState.value,
    grid: newGrid,
    isDrawing: false,
    isComplete,
  };

  if (isComplete) {
    showCompletionAnimation.value = true;
  }
};

const checkWinCondition = (grid: Cell[][], path: string[]): boolean => {
  // Get all numbered cells in order
  const numberedCells = grid
    .flat()
    .filter((cell) => cell.isNumbered)
    .sort((a, b) => (a.number || 0) - (b.number || 0));

  // Check if all cells are filled
  const allCellsFilled = grid
    .flat()
    .every((cell) => cell.isFilled || cell.isNumbered);

  if (!allCellsFilled || numberedCells.length === 0) return false;

  // Get the current path as array of cells
  const pathCells = path.map((cellId) => {
    const [row, col] = cellId.split("-").map(Number);
    return grid[row][col];
  });

  // Check if numbered cells appear in the correct order in the path
  let numberedCellIndex = 0;
  for (const cell of pathCells) {
    if (cell.isNumbered) {
      if (cell.number !== numberedCells[numberedCellIndex].number) {
        return false; // Numbers are not in sequence
      }
      numberedCellIndex++;
    }
  }

  // Check if we found all numbered cells in the path
  return numberedCellIndex === numberedCells.length;
};

const handleAnimationComplete = () => {
  showCompletionAnimation.value = false;
  toast.success("Congratulations! You solved the puzzle!");
};

const handleUndo = () => {
  if (gameHistory.value.length > 0) {
    const previousState = gameHistory.value[gameHistory.value.length - 1];
    gameState.value = previousState;
    gameHistory.value = gameHistory.value.slice(0, -1);
  }
};

const handleHint = () => {
  // If no path exists, start with the first two cells of the solution
  if (gameState.value.currentPath.length === 0) {
    const [firstCell, secondCell] = gameState.value.solutionPath;
    const firstCellId = `${firstCell[0]}-${firstCell[1]}`;
    const secondCellId = `${secondCell[0]}-${secondCell[1]}`;

    const newGrid = gameState.value.grid.map((row: Cell[]) =>
      row.map((cell: Cell) => ({
        ...cell,
        isFilled: cell.id === firstCellId || cell.id === secondCellId,
        isPath: cell.id === firstCellId || cell.id === secondCellId,
      }))
    );

    gameState.value = {
      ...gameState.value,
      grid: newGrid,
      currentPath: [firstCellId, secondCellId],
      hintsUsed: gameState.value.hintsUsed + 1,
    };

    const firstCellInPath = gameState.value.grid[firstCell[0]][firstCell[1]];
    const secondCellInPath = gameState.value.grid[secondCell[0]][secondCell[1]];

    if (firstCellInPath.isNumbered && secondCellInPath.isNumbered) {
      toast.info(
        `Connected number ${firstCellInPath.number} to ${secondCellInPath.number}!`
      );
    } else if (firstCellInPath.isNumbered) {
      toast.info(`Started path from number ${firstCellInPath.number}!`);
    } else {
      toast.info("Started the path!");
    }
    return;
  }

  // Convert current path to coordinates for comparison
  const currentPathCoords = gameState.value.currentPath.map(
    (cellId: string) => {
      const [row, col] = cellId.split("-").map(Number);
      return [row, col] as [number, number];
    }
  );

  // Find the last position in the current path that matches the solution path
  let lastCorrectIndex = -1;
  let solutionIndex = -1;

  for (let i = 0; i < currentPathCoords.length; i++) {
    const [currentRow, currentCol] = currentPathCoords[i];
    const foundIndex = gameState.value.solutionPath.findIndex(
      ([row, col]: [number, number]) => row === currentRow && col === currentCol
    );

    if (foundIndex !== -1) {
      // Check if this cell is in the correct sequence
      const previousCellCorrect =
        i === 0 ||
        (currentPathCoords[i - 1][0] ===
          gameState.value.solutionPath[foundIndex - 1]?.[0] &&
          currentPathCoords[i - 1][1] ===
            gameState.value.solutionPath[foundIndex - 1]?.[1]);

      if (previousCellCorrect) {
        lastCorrectIndex = i;
        solutionIndex = foundIndex;
      }
    }
  }

  // If we found a deviation, revert to the last correct cell
  if (lastCorrectIndex !== currentPathCoords.length - 1) {
    const correctPath = gameState.value.currentPath.slice(
      0,
      lastCorrectIndex + 1
    );
    const newGrid = gameState.value.grid.map((row: Cell[]) =>
      row.map((cell: Cell) => ({
        ...cell,
        isFilled: correctPath.includes(cell.id),
        isPath: correctPath.includes(cell.id),
      }))
    );

    gameState.value = {
      ...gameState.value,
      grid: newGrid,
      currentPath: correctPath,
      hintsUsed: gameState.value.hintsUsed + 1,
    };

    toast.warning("Reverting to last correct position!");
    return;
  }

  // Continue with the next correct cell
  if (
    solutionIndex >= 0 &&
    solutionIndex < gameState.value.solutionPath.length - 1
  ) {
    const nextCell = gameState.value.solutionPath[solutionIndex + 1];
    const nextCellId = `${nextCell[0]}-${nextCell[1]}`;

    const newGrid = gameState.value.grid.map((row: Cell[]) =>
      row.map((cell: Cell) => ({
        ...cell,
        isFilled: cell.id === nextCellId ? true : cell.isFilled,
        isPath: cell.id === nextCellId ? true : cell.isPath,
      }))
    );

    const newPath = [...gameState.value.currentPath, nextCellId];
    const isComplete = checkWinCondition(newGrid, newPath);
    if (isComplete) {
      gameState.value = { ...gameState.value, isComplete: true };
      showCompletionAnimation.value = true;
    }

    gameState.value = {
      ...gameState.value,
      grid: newGrid,
      currentPath: newPath,
      hintsUsed: gameState.value.hintsUsed + 1,
    };

    const nextCellInPath = gameState.value.grid[nextCell[0]][nextCell[1]];
    if (nextCellInPath.isNumbered) {
      toast.info(`Connected to number ${nextCellInPath.number}!`);
    } else {
      toast.info("Added the next cell in the path!");
    }
  } else {
    toast.info("You're at the end of the path!");
  }
};

const handleClear = () => {
  // Clear all drawn lines while keeping the same level
  const clearedGrid = gameState.value.grid.map((row: Cell[]) =>
    row.map((cell: Cell) => ({
      ...cell,
      isFilled: false,
      isPath: false,
      isHighlighted: false,
    }))
  );

  gameState.value = {
    ...gameState.value,
    grid: clearedGrid,
    currentPath: [],
    isDrawing: false,
    moves: 0,
    hintsUsed: 0,
  };

  timeElapsed.value = 0;
  isTimerRunning.value = false;
  gameHistory.value = [];
  toast.info("Grid cleared! Try again.");
};

const getRandomDifficulty = (): "easy" | "medium" | "hard" => {
  const difficulties: ("easy" | "medium" | "hard")[] = [
    "easy",
    "medium",
    "hard",
  ];
  const randomIndex = Math.floor(Math.random() * difficulties.length);
  return difficulties[randomIndex];
};

const handleNewGame = () => {
  // Clear any active solution animation
  if (solutionTimeout.value) {
    clearTimeout(solutionTimeout.value);
    solutionTimeout.value = null;
  }

  try {
    const newDifficulty = getRandomDifficulty();
    difficulty.value = newDifficulty;
    const level = generateRandomLevel(newDifficulty);
    gridSize.value = level.gridSize;
    initializeGrid(level);
    timeElapsed.value = 0;
    isTimerRunning.value = false;
    toast.success(`New ${newDifficulty} game started!`);
  } catch (error) {
    console.error("Failed to generate level:", error);
    toast.error("Failed to start a new game. Please try again.");
    // Fallback to easy level if random generation fails
    const level = generateRandomLevel("easy");
    gridSize.value = level.gridSize;
    difficulty.value = "easy";
    initializeGrid(level);
    timeElapsed.value = 0;
    isTimerRunning.value = false;
    toast.success("New game started!");
  }
};

const animateSolution = () => {
  // Clear any existing solution animation
  if (solutionTimeout.value) {
    clearTimeout(solutionTimeout.value);
    solutionTimeout.value = null;
  }

  const { solutionPath } = gameState.value;
  let index = 1;

  const revealStep = () => {
    if (index <= solutionPath.length) {
      const currentPath = solutionPath
        .slice(0, index)
        .map(([row, col]: [number, number]) => `${row}-${col}`);

      const newGrid = gameState.value.grid.map((row: Cell[]) =>
        row.map((cell: Cell) => ({
          ...cell,
          isFilled: currentPath.includes(cell.id),
          isPath: currentPath.includes(cell.id),
        }))
      );

      gameState.value = {
        ...gameState.value,
        grid: newGrid,
        currentPath,
      };

      index++;
      solutionTimeout.value = setTimeout(revealStep, 100); // Faster animation
    } else {
      gameState.value = { ...gameState.value, isComplete: true };
      showCompletionAnimation.value = true;
      solutionTimeout.value = null;
    }
  };

  // Start with the first cell
  gameState.value = {
    ...gameState.value,
    currentPath: [`${solutionPath[0][0]}-${solutionPath[0][1]}`],
  };
  solutionTimeout.value = setTimeout(revealStep, 100);
};
</script>

<template>
  <div
    class="min-h-screen w-full mx-auto bg-gradient-to-br from-gray-50 to-gray-100 p-2 lg:p-4">
    <div class="max-w-sm lg:max-w-md mx-auto space-y-4 w-full">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ difficulty.charAt(0).toUpperCase() + difficulty.slice(1) }} Level
          ({{ gridSize }}×{{ gridSize }})
        </h1>
        <div class="flex items-center justify-center gap-4 text-gray-600">
          <div class="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd" />
            </svg>
            <span class="font-medium">{{ formatTime(timeElapsed) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-medium">Moves: {{ gameState.moves }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-medium">Hints: {{ gameState.hintsUsed }}</span>
          </div>
        </div>
      </div>

      <!-- Game Grid -->
      <div v-if="gameState.grid.length > 0" class="w-full aspect-square">
        <GameGrid
          :grid="gameState.grid"
          :current-path="gameState.currentPath"
          :is-drawing="gameState.isDrawing"
          @mouseDown="handleMouseDown"
          @mouseMove="handleMouseMove"
          @mouseUp="handleMouseUp"
          @mouseLeave="handleMouseLeave"
          :is-complete="gameState.isComplete"
          :show-completion-animation="showCompletionAnimation"
          :colors="gameColors" />
      </div>
      <div v-else class="flex items-center min-h-48 justify-center h-full">
        <LucideLoader2 class="w-10 h-10 animate-spin" />
      </div>

      <!-- Game Controls -->
      <GameControls
        :can-undo="gameHistory.length > 0"
        :is-complete="gameState.isComplete"
        @undo="handleUndo"
        @hint="handleHint"
        @clear="handleClear" />

      <!-- Instructions -->
      <GameInstructions :colors="gameColors" />

      <!-- New Game Button -->
      <Button
        @click="handleNewGame"
        class="w-full bg-gray-800 hover:bg-gray-900 text-white py-1 rounded-xl font-medium">
        New Game
      </Button>

      <!-- Solve Button -->
      <Button
        @click="animateSolution"
        class="w-full text-white py-1 rounded-xl font-medium opacity-80 hover:opacity-100"
        :style="{ background: gameColors.end }">
        Solve
      </Button>
    </div>

    <!-- Completion Animation -->
    <CompletionAnimation
      :is-complete="gameState.isComplete"
      :colors="gameColors"
      :time-elapsed="timeElapsed"
      @animationComplete="handleAnimationComplete"
      @newGame="handleNewGame"
      :on-new-game="handleNewGame" />
  </div>
</template>
