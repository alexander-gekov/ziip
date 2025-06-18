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
        });
      }
      grid.push(gridRow);
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

    // Check if clicking on the last cell of the current path
    if (
      gameState.currentPath.length > 0 &&
      cellId === gameState.currentPath[gameState.currentPath.length - 1]
    ) {
      saveGameState();
      setGameState((prev) => ({
        ...prev,
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

    // Don't allow moving to cells that are already in the path (except the last cell)
    if (
      gameState.currentPath.includes(cellId) &&
      cellId !== gameState.currentPath[gameState.currentPath.length - 1]
    )
      return;

    const lastCell = gameState.currentPath[gameState.currentPath.length - 1];
    if (isAdjacent(cellId, lastCell)) {
      setGameState((prev) => ({
        ...prev,
        currentPath: [...prev.currentPath, cellId],
      }));
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

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
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

    const isComplete = checkWinCondition(newGrid);

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

  const checkWinCondition = (grid: Cell[][]): boolean => {
    // Get all numbered cells in order
    const numberedCells = grid
      .flat()
      .filter((cell) => cell.isNumbered)
      .sort((a, b) => (a.number || 0) - (b.number || 0));

    // Check if all cells are filled
    const allCellsFilled = grid
      .flat()
      .every((cell) => cell.isFilled || cell.isNumbered);

    // Check if numbered cells are connected in order
    for (let i = 0; i < numberedCells.length - 1; i++) {
      const current = numberedCells[i];
      const next = numberedCells[i + 1];

      // Find a path between consecutive numbered cells
      const pathExists = findPathBetweenCells(grid, current, next);
      if (!pathExists) return false;
    }

    return allCellsFilled && numberedCells.length > 0;
  };

  const findPathBetweenCells = (
    grid: Cell[][],
    start: Cell,
    end: Cell
  ): boolean => {
    const visited = new Set<string>();
    const queue: Cell[] = [start];
    visited.add(start.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === end.id) return true;

      const [row, col] = current.id.split("-").map(Number);
      const adjacent = getAdjacentCells(grid, row, col);

      for (const next of adjacent) {
        if (!visited.has(next.id) && (next.isFilled || next.isNumbered)) {
          visited.add(next.id);
          queue.push(next);
        }
      }
    }

    return false;
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
    // Find the next numbered cell that needs to be connected
    const numberedCells = gameState.grid
      .flat()
      .filter((cell) => cell.isNumbered)
      .sort((a, b) => (a.number || 0) - (b.number || 0));

    let nextNumberToConnect = 1;
    for (let i = 0; i < numberedCells.length - 1; i++) {
      const current = numberedCells[i];
      const next = numberedCells[i + 1];
      if (!findPathBetweenCells(gameState.grid, current, next)) {
        nextNumberToConnect = next.number || 1;
        break;
      }
    }

    // Find the solution path segment for this number
    const solutionIndex = gameState.solutionPath.findIndex(([row, col]) => {
      const cell = gameState.grid[row][col];
      return cell.isNumbered && cell.number === nextNumberToConnect;
    });

    if (solutionIndex >= 0) {
      // Highlight the next few steps in the solution path
      const hintLength = 3;
      const hintPath = gameState.solutionPath.slice(
        Math.max(0, solutionIndex - 1),
        solutionIndex + hintLength
      );

      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isHighlighted: hintPath.some(
            ([r, c]) => r === cell.row && c === cell.col
          ),
        }))
      );

      setGameState((prev) => ({
        ...prev,
        grid: newGrid,
        hintsUsed: prev.hintsUsed + 1,
      }));

      // Clear hint after a delay
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          grid: prev.grid.map((row) =>
            row.map((cell) => ({ ...cell, isHighlighted: false }))
          ),
        }));
      }, 2000);

      toast.info(`Connect to number ${nextNumberToConnect}!`);
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
    } catch (error) {
      console.error("Failed to generate level:", error);
      toast.error("Failed to start a new game. Please try again.");
      // Fallback to easy level if random generation fails
      const level = generateRandomLevel("easy");
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
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-2 lg:p-4">
        <div className="max-w-sm lg:max-w-md mx-auto space-y-6  w-full">
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
          <GameInstructions />

          {/* New Game Button */}
          <Button
            onClick={handleNewGame}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium">
            New Game
          </Button>

          {/* Solve Button */}
          <Button
            onClick={animateSolution}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
            Solve
          </Button>
        </div>

        {/* Completion Animation */}
        <CompletionAnimation
          isComplete={gameState.isComplete}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ZipGame;
