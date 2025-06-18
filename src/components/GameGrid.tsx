
import React from 'react';
import { Cell } from './ZipGame';
import { cn } from '@/lib/utils';

interface GameGridProps {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  onCellClick: (cellId: string) => void;
  onCellHover: (cellId: string) => void;
  onPathFinalize: () => void;
  isComplete: boolean;
  showCompletionAnimation: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  grid,
  currentPath,
  isDrawing,
  onCellClick,
  onCellHover,
  onPathFinalize,
  isComplete,
  showCompletionAnimation
}) => {
  const handleMouseUp = () => {
    if (isDrawing) {
      onPathFinalize();
    }
  };

  const getCellClasses = (cell: Cell) => {
    const isInCurrentPath = currentPath.includes(cell.id);
    const isPathStart = currentPath[0] === cell.id;
    const isPathEnd = currentPath[currentPath.length - 1] === cell.id && currentPath.length > 1;

    return cn(
      "w-12 h-12 border-2 rounded-lg transition-all duration-150 cursor-pointer relative",
      "flex items-center justify-center font-bold text-sm",
      {
        // Numbered cells
        "bg-green-500 border-green-600 text-white shadow-lg": cell.isNumbered,
        "bg-green-600 border-green-700": cell.isNumbered && isInCurrentPath,
        
        // Current path cells (smooth highlighting)
        "bg-green-400 border-green-500": isInCurrentPath && !cell.isNumbered,
        "bg-green-300 border-green-400": cell.isFilled && !cell.isNumbered && !isInCurrentPath,
        
        // Empty cells
        "bg-white border-gray-200 hover:border-gray-300": !cell.isFilled && !cell.isNumbered && !isInCurrentPath,
        "bg-gray-100 border-gray-300": !cell.isFilled && !cell.isNumbered && !isInCurrentPath && isComplete,
        
        // Start and end emphasis
        "scale-110 shadow-lg": isPathStart || isPathEnd,
        
        // Completion animation - make filled cells glow and scale
        "animate-pulse bg-gradient-to-r from-green-400 to-blue-500 border-blue-600 scale-110 shadow-xl": 
          showCompletionAnimation && (cell.isFilled || cell.isNumbered),
      }
    );
  };

  return (
    <div className="flex justify-center">
      <div 
        className={cn(
          "grid gap-1 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 transition-all duration-500",
          showCompletionAnimation && "scale-105 shadow-2xl bg-gradient-to-br from-green-50 to-blue-50"
        )}
        style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {grid.flat().map((cell) => (
          <div
            key={cell.id}
            className={getCellClasses(cell)}
            onClick={() => onCellClick(cell.id)}
            onMouseEnter={() => onCellHover(cell.id)}
          >
            {cell.isNumbered && (
              <span className="relative z-10 select-none">
                {cell.number}
              </span>
            )}
            
            {/* Smooth path indicator */}
            {currentPath.includes(cell.id) && !cell.isNumbered && (
              <div className="absolute inset-1 bg-green-500 rounded opacity-90 transition-all duration-150" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
