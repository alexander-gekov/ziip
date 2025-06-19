import React, { useState, useEffect, useCallback, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameGrid } from "./GameGrid";
import { GameControls } from "./GameControls";
import { GameInstructions } from "./GameInstructions";
import { CompletionAnimation } from "./CompletionAnimation";
import {
  generateDailyLevel,
  Level,
  NumberedCell,
  generateRandomLevel,
} from "../utils/levelGenerator";
import { toast } from "sonner";
import { generateGameColors, type GameColors } from "@/hooks/useGameColors";

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

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<object>> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong. Please try again later.</h2>;
    }

    return this.props.children;
  }
}

const ZipGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    currentPath: [],
    isDrawing: false,
    isComplete: false,
    moves: 0,
    hintsUsed: 0,
    solutionPath: [],
  });

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [gridSize, setGridSize] = useState(6);
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameColors, setGameColors] = useState<GameColors>(generateGameColors);

  // Initialize game with daily level
  useEffect(() => {
    try {
      const level = generateDailyLevel();
      setGridSize(level.gridSize);
      setDifficulty(level.difficulty);
      initializeGrid(level);
    } catch (error) {
      console.error("Failed to generate level:", error);
      // Fallback to easy level if daily generation fails
      const level = generateRandomLevel("easy");
      setGridSize(level.gridSize);
      setDifficulty(level.difficulty);
      initializeGrid(level);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !gameState.isComplete) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState.isComplete]);

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

    setGameState({
      grid,
      currentPath: [],
      isDrawing: false,
      isComplete: false,
      moves: 0,
      hintsUsed: 0,
      solutionPath: level.solutionPath,
    });
    setGameHistory([]);
    setGameColors(generateGameColors());
  };

  const saveGameState = useCallback(() => {
    setGameHistory((prev) => [...prev, { ...gameState }]);
  }, [gameState]);

  const handleMouseDown = (cellId: string) => {
    const [row, col] = cellId.split("-").map(Number);
    const cell = gameState.grid[row][col];

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    // If clicking on a numbered cell while not drawing, start a new path
    if (
      cell.isNumbered &&
      !gameState.isDrawing &&
      gameState.currentPath.length === 0
    ) {
      saveGameState();
      setGameState((prev) => ({
        ...prev,
        currentPath: [cellId],
        isDrawing: true,
        moves: prev.moves + 1,
      }));
      return;
    }

    // If clicking on a numbered cell while drawing, check if it's the next number in sequence
    if (cell.isNumbered && gameState.isDrawing) {
      const lastCell = gameState.grid[row][col];
      const currentNumber = lastCell.number || 0;
      const firstCell = gameState.currentPath[0].split("-").map(Number);
      const startCell = gameState.grid[firstCell[0]][firstCell[1]];
      const startNumber = startCell.number || 0;

      // Only allow connecting to the next number in sequence
      if (currentNumber === startNumber + 1) {
        saveGameState();
        setGameState((prev) => ({
          ...prev,
          currentPath: [...prev.currentPath, cellId],
          isDrawing: false,
          moves: prev.moves + 1,
        }));
        finalizePath();
      }
      return;
    }

    // Check if clicking on any cell in the current path
    if (gameState.currentPath.includes(cellId)) {
      const cellIndex = gameState.currentPath.indexOf(cellId);
      const newPath = gameState.currentPath.slice(0, cellIndex + 1);

      // Update the grid to clear highlighting from removed cells
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isFilled: newPath.includes(cell.id),
          isPath: newPath.includes(cell.id),
          isHighlighted: false,
        }))
      );

      saveGameState();
      setGameState((prev) => ({
        ...prev,
        grid: newGrid,
        currentPath: newPath,
        isDrawing: true,
        moves: prev.moves + 1,
      }));
      return;
    }

    // Check if we can continue from the last path
    if (gameState.currentPath.length > 0) {
      const lastCell = gameState.currentPath[gameState.currentPath.length - 1];
      // Only allow continuing to cells that aren't already in the path
      if (
        isAdjacent(cellId, lastCell) &&
        !gameState.currentPath.includes(cellId)
      ) {
        saveGameState();
        setGameState((prev) => ({
          ...prev,
          currentPath: [...prev.currentPath, cellId],
          isDrawing: true,
          moves: prev.moves + 1,
        }));
      }
    }
  };

  const handleMouseMove = (cellId: string) => {
    if (!gameState.isDrawing) return;

    const lastCell = gameState.currentPath[gameState.currentPath.length - 1];

    // Check if we're moving to an adjacent cell
    if (isAdjacent(cellId, lastCell)) {
      // Case 1: Moving to a cell that's already in our path (backtracking)
      if (gameState.currentPath.includes(cellId)) {
        const cellIndex = gameState.currentPath.indexOf(cellId);
        // Only allow backtracking if we're moving to the previous cell in the path
        if (cellIndex === gameState.currentPath.length - 2) {
          const newPath = gameState.currentPath.slice(0, cellIndex + 1);

          // Update the grid to clear highlighting from removed cells
          const newGrid = gameState.grid.map((row) =>
            row.map((cell) => ({
              ...cell,
              isFilled: newPath.includes(cell.id),
              isPath: newPath.includes(cell.id),
            }))
          );

          setGameState((prev) => ({
            ...prev,
            grid: newGrid,
            currentPath: newPath,
          }));
        }
      }
      // Case 2: Moving to a new cell (extending the path)
      else {
        const newPath = [...gameState.currentPath, cellId];
        const newGrid = gameState.grid.map((row) =>
          row.map((cell) => ({
            ...cell,
            isFilled: newPath.includes(cell.id),
            isPath: newPath.includes(cell.id),
          }))
        );

        setGameState((prev) => ({
          ...prev,
          grid: newGrid,
          currentPath: newPath,
        }));
      }
    }
  };

  const handleMouseUp = () => {
    if (gameState.isDrawing) {
      finalizePath();
    }
  };

  const handleMouseLeave = () => {
    if (gameState.isDrawing) {
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
    const cell1 = gameState.grid[row1][col1];
    const cell2 = gameState.grid[row2][col2];

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
    if (gameState.currentPath.length < 2) {
      setGameState((prev) => ({
        ...prev,
        isDrawing: false,
      }));
      return;
    }

    const newGrid = gameState.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isFilled: gameState.currentPath.includes(cell.id)
          ? true
          : cell.isFilled,
        isPath: gameState.currentPath.includes(cell.id) ? true : cell.isPath,
        isHighlighted: false,
      }))
    );

    const isComplete = checkWinCondition(newGrid, gameState.currentPath);

    setGameState((prev) => ({
      ...prev,
      grid: newGrid,
      isDrawing: false,
      isComplete,
    }));

    if (isComplete) {
      setShowCompletionAnimation(true);
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

  const getAdjacentCells = (
    grid: Cell[][],
    row: number,
    col: number
  ): Cell[] => {
    const adjacent: Cell[] = [];
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
        newRow < grid.length &&
        newCol >= 0 &&
        newCol < grid[0].length
      ) {
        adjacent.push(grid[newRow][newCol]);
      }
    }

    return adjacent;
  };

  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
    toast.success("Congratulations! You solved the puzzle!");
  };

  const handleUndo = () => {
    if (gameHistory.length > 0) {
      const previousState = gameHistory[gameHistory.length - 1];
      setGameState(previousState);
      setGameHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleHint = () => {
    // If no path exists, start with the first two cells of the solution
    if (gameState.currentPath.length === 0) {
      const [firstCell, secondCell] = gameState.solutionPath;
      const firstCellId = `${firstCell[0]}-${firstCell[1]}`;
      const secondCellId = `${secondCell[0]}-${secondCell[1]}`;

      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isFilled: cell.id === firstCellId || cell.id === secondCellId,
          isPath: cell.id === firstCellId || cell.id === secondCellId,
        }))
      );

      setGameState((prev) => ({
        ...prev,
        grid: newGrid,
        currentPath: [firstCellId, secondCellId],
        hintsUsed: prev.hintsUsed + 1,
      }));

      const firstCellInPath = gameState.grid[firstCell[0]][firstCell[1]];
      const secondCellInPath = gameState.grid[secondCell[0]][secondCell[1]];

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
    const currentPathCoords = gameState.currentPath.map((cellId) => {
      const [row, col] = cellId.split("-").map(Number);
      return [row, col];
    });

    // Find the last position in the current path that matches the solution path
    let lastCorrectIndex = -1;
    let solutionIndex = -1;

    for (let i = 0; i < currentPathCoords.length; i++) {
      const [currentRow, currentCol] = currentPathCoords[i];
      const foundIndex = gameState.solutionPath.findIndex(
        ([row, col]) => row === currentRow && col === currentCol
      );

      if (foundIndex !== -1) {
        // Check if this cell is in the correct sequence
        const previousCellCorrect =
          i === 0 ||
          (currentPathCoords[i - 1][0] ===
            gameState.solutionPath[foundIndex - 1]?.[0] &&
            currentPathCoords[i - 1][1] ===
              gameState.solutionPath[foundIndex - 1]?.[1]);

        if (previousCellCorrect) {
          lastCorrectIndex = i;
          solutionIndex = foundIndex;
        }
      }
    }

    // If we found a deviation, revert to the last correct cell
    if (lastCorrectIndex !== currentPathCoords.length - 1) {
      const correctPath = gameState.currentPath.slice(0, lastCorrectIndex + 1);
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isFilled: correctPath.includes(cell.id),
          isPath: correctPath.includes(cell.id),
        }))
      );

      setGameState((prev) => ({
        ...prev,
        grid: newGrid,
        currentPath: correctPath,
        hintsUsed: prev.hintsUsed + 1,
      }));

      toast.warning("Reverting to last correct position!");
      return;
    }

    // Continue with the next correct cell
    if (
      solutionIndex >= 0 &&
      solutionIndex < gameState.solutionPath.length - 1
    ) {
      const nextCell = gameState.solutionPath[solutionIndex + 1];
      const nextCellId = `${nextCell[0]}-${nextCell[1]}`;

      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isFilled: cell.id === nextCellId ? true : cell.isFilled,
          isPath: cell.id === nextCellId ? true : cell.isPath,
        }))
      );

      const newPath = [...gameState.currentPath, nextCellId];
      const isComplete = checkWinCondition(newGrid, newPath);
      if (isComplete) {
        setGameState((prev) => ({ ...prev, isComplete: true }));
        setShowCompletionAnimation(true);
      }

      setGameState((prev) => ({
        ...prev,
        grid: newGrid,
        currentPath: newPath,
        hintsUsed: prev.hintsUsed + 1,
      }));

      const nextCellInPath = gameState.grid[nextCell[0]][nextCell[1]];
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
    const clearedGrid = gameState.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isFilled: false,
        isPath: false,
        isHighlighted: false,
      }))
    );

    setGameState((prev) => ({
      ...prev,
      grid: clearedGrid,
      currentPath: [],
      isDrawing: false,
      moves: 0,
      hintsUsed: 0,
    }));

    setTimeElapsed(0);
    setIsTimerRunning(false);
    setGameHistory([]);
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
    try {
      const newDifficulty = getRandomDifficulty();
      setDifficulty(newDifficulty);
      const level = generateRandomLevel(newDifficulty);
      setGridSize(level.gridSize);
      initializeGrid(level);
      setTimeElapsed(0);
      setIsTimerRunning(false);
      toast.success(`New ${newDifficulty} game started!`);
      console.log(level);
    } catch (error) {
      console.error("Failed to generate level:", error);
      toast.error("Failed to start a new game. Please try again.");
      // Fallback to easy level if random generation fails
      const level = generateRandomLevel("easy");
      console.log(level);
      setGridSize(level.gridSize);
      setDifficulty("easy");
      initializeGrid(level);
      setTimeElapsed(0);
      setIsTimerRunning(false);
      toast.success("New game started!");
    }
  };

  const animateSolution = () => {
    const { solutionPath } = gameState;
    let index = 1;

    const revealStep = () => {
      if (index <= solutionPath.length) {
        const currentPath = solutionPath
          .slice(0, index)
          .map(([row, col]) => `${row}-${col}`);
        setGameState((prev) => {
          const newGrid = prev.grid.map((gridRow) =>
            gridRow.map((cell) => ({
              ...cell,
              isFilled: currentPath.includes(cell.id),
              isPath: currentPath.includes(cell.id),
            }))
          );
          return {
            ...prev,
            grid: newGrid,
            currentPath: currentPath,
          };
        });
        index++;
        setTimeout(revealStep, 100); // Faster animation
      } else {
        setGameState((prev) => ({ ...prev, isComplete: true }));
        setShowCompletionAnimation(true);
      }
    };

    // Start with the first cell
    setGameState((prev) => ({
      ...prev,
      currentPath: [`${solutionPath[0][0]}-${solutionPath[0][1]}`],
    }));
    setTimeout(revealStep, 100);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full mx-auto bg-gradient-to-br from-gray-50 to-gray-100 p-2 lg:p-4">
        <div className="max-w-sm lg:max-w-md mx-auto space-y-4 w-full">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level (
              {gridSize}×{gridSize})
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Moves: {gameState.moves}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  Hints: {gameState.hintsUsed}
                </span>
              </div>
            </div>
          </div>

          {/* Game Grid */}

          <div className="w-full aspect-square">
            <GameGrid
              grid={gameState.grid}
              currentPath={gameState.currentPath}
              isDrawing={gameState.isDrawing}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              isComplete={gameState.isComplete}
              showCompletionAnimation={showCompletionAnimation}
              colors={gameColors}
            />
          </div>

          {/* Game Controls */}
          <GameControls
            onUndo={handleUndo}
            onHint={handleHint}
            onClear={handleClear}
            canUndo={gameHistory.length > 0}
            isComplete={gameState.isComplete}
          />

          {/* Instructions */}
          <GameInstructions colors={gameColors} />

          {/* New Game Button */}
          <Button
            onClick={handleNewGame}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-1 rounded-xl font-medium">
            New Game
          </Button>

          {/* Solve Button */}
          <Button
            onClick={animateSolution}
            className="w-full text-white py-1 rounded-xl font-medium opacity-80 hover:opacity-100"
            style={{ background: gameColors.end }}>
            Solve
          </Button>
        </div>

        {/* Completion Animation */}
        <CompletionAnimation
          isComplete={gameState.isComplete}
          onAnimationComplete={handleAnimationComplete}
          colors={gameColors}
          timeElapsed={timeElapsed}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ZipGame;
