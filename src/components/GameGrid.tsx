import React, { useRef, useEffect, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(60);
  const [isInitialized, setIsInitialized] = useState(false);
  const gridSize = grid.length;
  const MIN_CELL_SIZE = 20;

  useEffect(() => {
    const updateCellSize = () => {
      if (containerRef.current) {
        const containerWidth =
          containerRef.current.clientWidth || window.innerWidth;
        const maxGridWidth = Math.min(containerWidth, window.innerWidth - 32);
        const newCellSize = Math.max(
          MIN_CELL_SIZE,
          Math.floor(maxGridWidth / gridSize)
        );
        setCellSize(newCellSize);
        setIsInitialized(true);
      }
    };

    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, [gridSize]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      ) as HTMLElement;
      const cellId = element?.getAttribute("data-cell-id");
      if (cellId) {
        onMouseDown(cellId);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      ) as HTMLElement;
      const cellId = element?.getAttribute("data-cell-id");
      if (cellId) {
        onMouseMove(cellId);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      onMouseUp();
    };

    grid.addEventListener("touchstart", handleTouchStart, { passive: false });
    grid.addEventListener("touchmove", handleTouchMove, { passive: false });
    grid.addEventListener("touchend", handleTouchEnd, { passive: false });
    grid.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      grid.removeEventListener("touchstart", handleTouchStart);
      grid.removeEventListener("touchmove", handleTouchMove);
      grid.removeEventListener("touchend", handleTouchEnd);
      grid.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [onMouseDown, onMouseMove, onMouseUp]);

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
    let totalLength = 0;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const prev = points[i - 1];
      const next = i < points.length - 1 ? points[i + 1] : null;

      if (next && i > 0) {
        const cornerRadius = Math.min(25, cellSize * 0.4);

        const prevDir = {
          x: current.x - prev.x,
          y: current.y - prev.y,
        };
        const nextDir = {
          x: next.x - current.x,
          y: next.y - current.y,
        };

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

        pathData += ` L ${approachPoint.x} ${approachPoint.y}`;
        pathData += ` Q ${current.x} ${current.y} ${departPoint.x} ${departPoint.y}`;

        totalLength += Math.sqrt(
          Math.pow(approachPoint.x - prev.x, 2) +
            Math.pow(approachPoint.y - prev.y, 2)
        );
        totalLength += (Math.PI / 2) * cornerRadius;
      } else {
        pathData += ` L ${current.x} ${current.y}`;
        totalLength += Math.sqrt(
          Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
        );
      }
    }

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const gradientElement = document.getElementById(
      "pathGradient"
    ) as unknown as SVGLinearGradientElement;
    if (gradientElement) {
      gradientElement.setAttribute("x1", startPoint.x.toString());
      gradientElement.setAttribute("y1", startPoint.y.toString());
      gradientElement.setAttribute("x2", endPoint.x.toString());
      gradientElement.setAttribute("y2", endPoint.y.toString());
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
    const size = Math.min(40, cellSize * 0.6);
    return cn(
      "rounded-full text-white z-30 relative",
      "flex items-center justify-center text-lg font-bold",
      "border-2 border-white shadow-lg transition-all duration-300",
      "select-none pointer-events-none",
      {
        "bg-gray-800": !isInCurrentPath,
        "bg-orange-600 scale-110": isInCurrentPath,
      }
    );
  };

  if (!isInitialized) {
    return <div className="flex justify-center" ref={containerRef}></div>;
  }

  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;

  return (
    <div className="flex justify-center touch-none" ref={containerRef}>
      <div className="relative">
        {/* Grid Container */}
        <div
          ref={gridRef}
          className={cn(
            "grid border-2 border-gray-400 bg-gray-100 rounded-lg overflow-hidden",
            "shadow-lg transition-all duration-500 touch-none",
            showCompletionAnimation && "scale-105 shadow-xl"
          )}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
          }}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}>
          {/* Grid Cells */}
          {grid.flat().map((cell) => (
            <div
              key={cell.id}
              data-cell-id={cell.id}
              className={getCellClasses(cell)}
              onMouseDown={() => onMouseDown(cell.id)}
              onMouseEnter={() => onMouseMove(cell.id)}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}>
              {cell.isNumbered && (
                <div
                  className={getNumberedCellClasses(cell)}
                  style={{
                    width: `${Math.min(40, cellSize * 0.6)}px`,
                    height: `${Math.min(40, cellSize * 0.6)}px`,
                    fontSize: `${Math.min(20, cellSize * 0.3)}px`,
                  }}>
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
            width={gridWidth}
            height={gridHeight}
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
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
                gradientTransform="rotate(0)">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#f93316" />
              </linearGradient>
            </defs>

            {/* Shadow/outline path */}
            <path
              d={getPathData()}
              stroke="url(#pathGradient)"
              strokeWidth={cellSize * 0.7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1}
              pathLength="1"
              className={cn(
                "transition-all duration-300",
                showCompletionAnimation && "animate-pulse"
              )}
            />

            {/* Main path with gradient and glow */}
            <path
              d={getPathData()}
              stroke="url(#pathGradient)"
              strokeWidth={cellSize * 0.7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              opacity={1}
              pathLength="1"
              className={cn(
                "transition-all duration-300",
                showCompletionAnimation && "animate-pulse"
              )}
            />
          </svg>
        )}
      </div>
    </div>
  );
};
