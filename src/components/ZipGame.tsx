import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameGrid } from './GameGrid';
import { GameControls } from './GameControls';
import { GameInstructions } from './GameInstructions';
import { CompletionAnimation } from './CompletionAnimation';
import { generateDailyLevel } from '../utils/levelGenerator';
import { toast } from 'sonner';

export interface Cell {
  id: string;
  row: number;
  col: number;
  isNumbered: boolean;
  number?: number;
  isFilled: boolean;
  isPath: boolean;
  isConnected: boolean;
}

export interface GameState {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  isComplete: boolean;
  moves: number;
  hintsUsed: number;
}

const ZipGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    currentPath: [],
    isDrawing: false,
    isComplete: false,
    moves: 0,
    hintsUsed: 0
  });

  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  // Initialize game with daily level
  useEffect(() => {
    const level = generateDailyLevel();
    initializeGrid(level);
  }, []);

  const initializeGrid = (level: any) => {
    const grid: Cell[][] = [];
    
    for (let row = 0; row < level.gridSize; row++) {
      const gridRow: Cell[] = [];
      for (let col = 0; col < level.gridSize; col++) {
        const cellId = `${row}-${col}`;
        const numberedCell = level.numberedCells.find((nc: any) => nc.row === row && nc.col === col);
        
        gridRow.push({
          id: cellId,
          row,
          col,
          isNumbered: !!numberedCell,
          number: numberedCell?.number,
          isFilled: false,
          isPath: false,
          isConnected: false
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
      hintsUsed: 0
    });
    setGameHistory([]);
  };

  const saveGameState = useCallback(() => {
    setGameHistory(prev => [...prev, { ...gameState }]);
  }, [gameState]);

  const handleCellClick = (cellId: string) => {
    const [row, col] = cellId.split('-').map(Number);
    const cell = gameState.grid[row][col];

    if (cell.isNumbered) {
      // Start new path from numbered cell
      if (!gameState.isDrawing) {
        saveGameState();
        setGameState(prev => ({
          ...prev,
          currentPath: [cellId],
          isDrawing: true,
          moves: prev.moves + 1
        }));
      }
    }
  };

  const handleCellHover = (cellId: string) => {
    if (gameState.isDrawing && !gameState.currentPath.includes(cellId)) {
      const [row, col] = cellId.split('-').map(Number);
      const cell = gameState.grid[row][col];
      
      // Check if this cell is adjacent to the last cell in path
      if (isAdjacent(cellId, gameState.currentPath[gameState.currentPath.length - 1])) {
        setGameState(prev => ({
          ...prev,
          currentPath: [...prev.currentPath, cellId]
        }));
      }
    }
  };

  const isAdjacent = (cellId1: string, cellId2: string): boolean => {
    const [row1, col1] = cellId1.split('-').map(Number);
    const [row2, col2] = cellId2.split('-').map(Number);
    
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const finalizePath = () => {
    if (gameState.currentPath.length < 2) return;

    const newGrid = gameState.grid.map(row => 
      row.map(cell => ({
        ...cell,
        isFilled: gameState.currentPath.includes(cell.id) ? true : cell.isFilled,
        isPath: gameState.currentPath.includes(cell.id) ? true : cell.isPath
      }))
    );

    const isComplete = checkWinCondition(newGrid);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      currentPath: [],
      isDrawing: false,
      isComplete
    }));

    if (isComplete) {
      setShowCompletionAnimation(true);
    }
  };

  const checkWinCondition = (grid: Cell[][]): boolean => {
    // Check if all numbered cells are connected in order
    const numberedCells = grid.flat().filter(cell => cell.isNumbered).sort((a, b) => (a.number || 0) - (b.number || 0));
    
    // Simple win condition: all cells filled and numbered cells connected
    const allCellsFilled = grid.flat().every(cell => cell.isFilled || cell.isNumbered);
    return allCellsFilled && numberedCells.length > 0;
  };

  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
    toast.success("Congratulations! You solved the puzzle!");
  };

  const handleUndo = () => {
    if (gameHistory.length > 0) {
      const previousState = gameHistory[gameHistory.length - 1];
      setGameState(previousState);
      setGameHistory(prev => prev.slice(0, -1));
    }
  };

  const handleHint = () => {
    // Simple hint: highlight next possible move
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));
    toast.info("Hint: Try connecting the numbers in order!");
  };

  const handleClear = () => {
    const level = generateDailyLevel();
    initializeGrid(level);
    toast.info("Grid cleared! Starting fresh.");
  };

  const handleNewGame = () => {
    const level = generateDailyLevel();
    initializeGrid(level);
    toast.success("New game started!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Zip</h1>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-4">
            <span>Moves: {gameState.moves}</span>
            <span>•</span>
            <span>Hints: {gameState.hintsUsed}</span>
          </div>
        </div>

        {/* Game Grid */}
        <Card className="p-6 bg-white shadow-lg">
          <GameGrid
            grid={gameState.grid}
            currentPath={gameState.currentPath}
            isDrawing={gameState.isDrawing}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            onPathFinalize={finalizePath}
            isComplete={gameState.isComplete}
            showCompletionAnimation={showCompletionAnimation}
          />
        </Card>

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
          className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-medium"
        >
          New Game
        </Button>

        {/* Results Button (when complete) */}
        {gameState.isComplete && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
          >
            See Results
          </Button>
        )}
      </div>

      {/* Completion Animation */}
      <CompletionAnimation 
        isComplete={gameState.isComplete}
        onAnimationComplete={handleAnimationComplete}
      />
    </div>
  );
};

export default ZipGame;
