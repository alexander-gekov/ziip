import React from "react";
import { Cell } from "./ZipGame";
import { cn } from "@/lib/utils";

interface GameGridProps {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  onMouseDown: (cellId: string) => void;
  onMouseMove: (cellId: string) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  isComplete: boolean;
  showCompletionAnimation: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  grid,
  currentPath,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  isComplete,
  showCompletionAnimation,
}) => {
  const cellSize = 60;
  const gridSize = grid.length;

  const getPathData = () => {
    if (currentPath.length < 2) return "";

    const points = currentPath.map((cellId) => {
      const [row, col] = cellId.split("-").map(Number);
      return {
        x: col * cellSize + cellSize / 2,
        y: row * cellSize + cellSize / 2,
      };
    });

    let pathData = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const prev = points[i - 1];
      const next = i < points.length - 1 ? points[i + 1] : null;

      if (next && i > 0) {
        // Calculate directions
        const prevDir = {
          x: current.x - prev.x,
          y: current.y - prev.y,
        };
        const nextDir = {
          x: next.x - current.x,
          y: next.y - current.y,
        };

        // Check if we're making a turn (directions are different)
        const isTurning = prevDir.x !== nextDir.x || prevDir.y !== nextDir.y;

        if (isTurning) {
          // Create smooth rounded corner
          const cornerRadius = Math.min(25, cellSize * 0.4);

          // Calculate approach and departure points
          const approachDistance = Math.min(
            cornerRadius,
            Math.sqrt(prevDir.x * prevDir.x + prevDir.y * prevDir.y) / 2
          );
          const departDistance = Math.min(
            cornerRadius,
            Math.sqrt(nextDir.x * nextDir.x + nextDir.y * nextDir.y) / 2
          );

          const approachPoint = {
            x: current.x - Math.sign(prevDir.x) * approachDistance,
            y: current.y - Math.sign(prevDir.y) * approachDistance,
          };

          const departPoint = {
            x: current.x + Math.sign(nextDir.x) * departDistance,
            y: current.y + Math.sign(nextDir.y) * departDistance,
          };

          // Draw line to approach point, then smooth curve to depart point
          pathData += ` L ${approachPoint.x} ${approachPoint.y}`;
          pathData += ` Q ${current.x} ${current.y} ${departPoint.x} ${departPoint.y}`;
        } else {
          // Straight line continuation
          pathData += ` L ${current.x} ${current.y}`;
        }
      } else {
        // First segment or last point - just draw straight line
        pathData += ` L ${current.x} ${current.y}`;
      }
    }

    return pathData;
  };

  const getCellClasses = (cell: Cell) => {
    const isInCurrentPath = currentPath.includes(cell.id);
    const isPathStart = currentPath[0] === cell.id;
    const isPathEnd =
      currentPath[currentPath.length - 1] === cell.id && currentPath.length > 1;

    return cn(
      "aspect-square transition-all duration-300 cursor-pointer relative",
      "flex items-center justify-center border border-gray-300",
      "hover:bg-gray-50",
      {
        "bg-white": !cell.isFilled && !cell.isHighlighted,
        "bg-orange-100": cell.isFilled && !isInCurrentPath,
        "bg-orange-300": isInCurrentPath,
        "bg-blue-100": !cell.isNumbered && cell.isHighlighted,
        "shadow-inner": cell.isFilled,
      }
    );
  };

  const getNumberedCellClasses = (cell: Cell) => {
    const isInCurrentPath = currentPath.includes(cell.id);
    return cn(
      "w-10 h-10 rounded-full text-white z-30 relative",
      "flex items-center justify-center text-lg font-bold",
      "border-2 border-white shadow-lg transition-all duration-300",
      "select-none pointer-events-none",
      {
        "bg-gray-800": !isInCurrentPath,
        "bg-orange-600 scale-110": isInCurrentPath,
      }
    );
  };

  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Grid Container */}
        <div
          className={cn(
            "grid border-2 border-gray-400 bg-gray-100 rounded-lg overflow-hidden",
            "shadow-lg transition-all duration-500",
            showCompletionAnimation && "scale-105 shadow-xl"
          )}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            width: gridSize * cellSize,
            height: gridSize * cellSize,
          }}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}>
          {/* Grid Cells */}
          {grid.flat().map((cell) => (
            <div
              key={cell.id}
              className={getCellClasses(cell)}
              onMouseDown={() => onMouseDown(cell.id)}
              onMouseEnter={() => onMouseMove(cell.id)}
              style={{
                width: cellSize,
                height: cellSize,
              }}>
              {cell.isNumbered && (
                <div className={getNumberedCellClasses(cell)}>
                  {cell.number}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SVG Overlay for Path Lines */}
        {currentPath.length > 1 && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={gridSize * cellSize}
            height={gridSize * cellSize}
            style={{ zIndex: 20 }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient
                id="pathGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* Shadow/outline path */}
            <path
              d={getPathData()}
              stroke="#000000"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.1"
            />

            {/* Main path with gradient and glow */}
            <path
              d={getPathData()}
              stroke={
                showCompletionAnimation ? "url(#pathGradient)" : "#ea580c"
              }
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className={cn(
                "transition-all duration-300",
                showCompletionAnimation && "animate-pulse"
              )}
            />

            {/* Connection dots at each cell */}
            {currentPath.map((cellId, index) => {
              const [row, col] = cellId.split("-").map(Number);
              const cell = grid[row][col];
              if (cell.isNumbered) return null; // Skip numbered cells

              return (
                <circle
                  key={`dot-${cellId}`}
                  cx={col * cellSize + cellSize / 2}
                  cy={row * cellSize + cellSize / 2}
                  r="4"
                  fill="#ea580c"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};
