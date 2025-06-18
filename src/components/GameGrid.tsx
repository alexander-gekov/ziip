import React, { useRef, useEffect, useState } from "react";
import { Cell } from "./ZipGame";
import { cn } from "@/lib/utils";
import { type GameColors } from "@/hooks/useGameColors";

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)].map(Math.round);
};

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
  colors: GameColors;
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
  colors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(60);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const gridSize = grid.length;
  const MIN_CELL_SIZE =
    (window.innerWidth || containerRef.current?.clientWidth) < 768 ? 20 : 40;

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

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [currentPath]);

  const getPathData = () => {
    if (currentPath.length < 2) return "";

    const points = currentPath.map((cellId) => {
      const [row, col] = cellId.split("-").map(Number);
      return {
        x: col * cellSize + cellSize / 2,
        y: row * cellSize + cellSize / 2,
        isNumbered: grid[row][col].isNumbered,
      };
    });

    let pathData = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const prev = points[i - 1];
      const next = i < points.length - 1 ? points[i + 1] : null;

      if (current.isNumbered) {
        pathData += ` L ${current.x} ${current.y}`;
        continue;
      }

      if (next && !next.isNumbered && i > 0) {
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
      } else {
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
      {
        "bg-white": !cell.isFilled && !cell.isHighlighted,
        [colors.filledBg]: cell.isFilled && !isInCurrentPath,
        [colors.activeBg]: isInCurrentPath,
        [colors.highlightBg]: !cell.isNumbered && cell.isHighlighted,
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
      "border-2 border-white shadow-lg",
      "select-none pointer-events-none",
      "transition-all duration-300",
      isInCurrentPath && "animate-[pop_0.5s_ease-out]"
    );
  };

  if (!isInitialized) {
    return <div className="flex justify-center" ref={containerRef}></div>;
  }

  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;

  return (
    <div className="flex justify-center touch-none" ref={containerRef}>
      <style>
        {`
          @keyframes pop {
            0% { 
              transform: scale(1);
              box-shadow: 0 0 5px rgba(255,255,255,0.2);
            }
            30% { 
              transform: scale(1.4);
              box-shadow: 0 0 20px rgba(255,255,255,0.6);
            }
            100% { 
              transform: scale(1);
              box-shadow: 0 0 5px rgba(255,255,255,0.2);
            }
          }
        `}
      </style>
      <div className="relative">
        {/* Grid Container */}
        <div
          ref={gridRef}
          className={cn(
            "grid border-2 border-gray-400 rounded-lg overflow-hidden",
            "shadow-lg transition-all duration-500 touch-none",
            showCompletionAnimation && "scale-105 shadow-xl"
          )}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            background: colors.startBg,
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
                    backgroundColor: currentPath.includes(cell.id)
                      ? colors.end
                      : colors.start,
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

              <linearGradient id="pathGradient" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={colors.start} />
                <stop offset="100%" stopColor={colors.end} />
              </linearGradient>

              <animate
                xlinkHref="#pathAnimation"
                attributeName="d"
                dur="0.3s"
                fill="freeze"
                calcMode="spline"
                keySplines="0.64, 0.57, 0.67, 1.53"
              />
            </defs>

            {/* Shadow/outline path */}
            <path
              ref={pathRef}
              d={getPathData()}
              stroke="url(#pathGradient)"
              strokeWidth={cellSize * 0.7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1}
              pathLength="1"
              className={cn(
                "transition-[d,stroke-dashoffset] duration-500 ease-in-out",
                showCompletionAnimation && "animate-pulse"
              )}
              style={{
                transition: "d 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                strokeDasharray: pathLength,
                strokeDashoffset: isDrawing ? 0 : pathLength * 0.15,
              }}
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
                "transition-[d,stroke-dashoffset] duration-500 ease-in-out",
                showCompletionAnimation && "animate-pulse"
              )}
              style={{
                transition: "d 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                strokeDasharray: pathLength,
                strokeDashoffset: isDrawing ? 0 : pathLength * 0.15,
              }}
            />
          </svg>
        )}
      </div>
    </div>
  );
};
