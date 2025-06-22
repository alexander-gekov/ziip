<template>
  <div class="flex justify-center touch-none select-none" ref="containerRef">
    <div v-if="isInitialized" class="relative">
      <div
        ref="gridRef"
        :class="[
          'grid border-2 border-gray-400 rounded-lg overflow-hidden shadow-lg',
          'transition-all duration-500 touch-none select-none',
          'outline-none focus:outline-none',
          { 'scale-105 shadow-xl': showCompletionAnimation },
        ]"
        :style="{
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          background: colors.startBg,
          touchAction: 'none',
        }"
        @mouseup="$emit('mouseUp')"
        @mouseleave="$emit('mouseLeave')">
        <div
          v-for="cell in flattenedGrid"
          :key="cell.id"
          :data-cell-id="cell.id"
          :class="getCellClasses(cell)"
          :style="{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
          }"
          @mousedown="$emit('mouseDown', cell.id)"
          @mouseenter="$emit('mouseMove', cell.id)"
          @touchstart.prevent="handleTouchStart"
          @touchmove.prevent="handleTouchMove"
          @touchend.prevent="handleTouchEnd"
          @touchcancel.prevent="handleTouchEnd">
          <div
            v-if="cell.isNumbered"
            :class="getNumberedCellClasses(cell)"
            :style="{
              width: `${Math.min(40, cellSize * 0.6)}px`,
              height: `${Math.min(40, cellSize * 0.6)}px`,
              fontSize: `${Math.min(20, cellSize * 0.3)}px`,
              backgroundColor: currentPath.includes(cell.id)
                ? colors.end
                : colors.start,
            }">
            {{ cell.number }}
          </div>
        </div>
      </div>

      <!-- SVG Overlay for Path Lines -->
      <svg
        v-if="currentPath.length > 1"
        class="absolute top-0 left-0 pointer-events-none"
        :width="gridWidth"
        :height="gridHeight"
        style="z-index: 20">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur
              :stdDeviation="Math.min(4, 12 / gridSize)"
              result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="pathGradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" :stop-color="colors.start" />
            <stop offset="100%" :stop-color="colors.end" />
          </linearGradient>
        </defs>

        <!-- Shadow/outline path -->
        <path
          ref="pathRef"
          :d="pathData"
          stroke="url(#pathGradient)"
          :stroke-width="strokeWidth"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="1"
          pathLength="1"
          :class="[
            'transition-[d,stroke-dashoffset] duration-500 ease-in-out',
            { 'animate-pulse': showCompletionAnimation },
            { 'path-stretch': !isDrawing },
          ]"
          :style="{
            transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            strokeDasharray: pathLength,
            strokeDashoffset: isDrawing ? 0 : pathLength * 0.15,
          }" />

        <!-- Main path with gradient and glow -->
        <path
          :d="pathData"
          stroke="url(#pathGradient)"
          :stroke-width="strokeWidth"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#glow)"
          opacity="1"
          pathLength="1"
          :class="[
            'transition-[d,stroke-dashoffset] duration-500 ease-in-out',
            { 'animate-pulse': showCompletionAnimation },
            { 'path-stretch': !isDrawing },
          ]"
          :style="{
            transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            strokeDasharray: pathLength,
            strokeDashoffset: isDrawing ? 0 : pathLength * 0.15,
          }" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import type { Cell } from "./ZipGame.vue";
import type { GameColors } from "~/composables/useGameColors";

interface GameGridProps {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  isComplete?: boolean;
  showCompletionAnimation?: boolean;
  colors: GameColors;
}

const props = withDefaults(defineProps<GameGridProps>(), {
  isComplete: false,
  showCompletionAnimation: false,
});

const emit = defineEmits<{
  mouseDown: [cellId: string];
  mouseMove: [cellId: string];
  mouseUp: [];
  mouseLeave: [];
}>();

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const gridRef = useTemplateRef<HTMLDivElement>("gridRef");
const pathRef = useTemplateRef<SVGPathElement>("pathRef");
const cellSize = ref(60);
const isInitialized = ref(false);
const pathLength = ref(0);

const { width: windowWidth } = useWindowSize();

const gridSize = computed(() => props.grid.length);

const MIN_CELL_SIZE = computed(() => {
  return windowWidth.value < 768 ? 20 : 40;
});

const flattenedGrid = computed(() => {
  if (!props.grid || !props.grid.length) return [];
  return props.grid.flat();
});

const gridWidth = computed(() => gridSize.value * cellSize.value);
const gridHeight = computed(() => gridSize.value * cellSize.value);

const strokeWidth = computed(() => {
  const baseWidth = props.isDrawing ? 0.3 : 0.5;
  const minWidth = props.isDrawing ? 12 : 16;
  const maxWidth = props.isDrawing ? 22 : 40;
  return Math.min(
    cellSize.value * baseWidth,
    Math.max(minWidth, maxWidth / (gridSize.value / 5))
  );
});

const pathData = computed(() => {
  if (props.currentPath.length < 2) return "";

  const points = props.currentPath.map((cellId: string) => {
    const [row, col] = cellId.split("-").map(Number);
    return {
      x: col * cellSize.value + cellSize.value / 2,
      y: row * cellSize.value + cellSize.value / 2,
      isNumbered: props.grid[row][col].isNumbered,
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
      const cornerRadius = Math.min(25, cellSize.value * 0.4);

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
});

const updateCellSize = () => {
  if (containerRef.value) {
    const containerWidth = containerRef.value.clientWidth || windowWidth.value;
    const maxGridWidth = Math.min(containerWidth - 32, 600);
    const newCellSize = Math.max(
      MIN_CELL_SIZE.value,
      Math.floor(maxGridWidth / gridSize.value)
    );
    cellSize.value = newCellSize;
    isInitialized.value = true;
  }
};

// Enhanced touch event handlers
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const element = e.target as HTMLElement;
  const cellId = element?.getAttribute("data-cell-id");
  if (cellId) {
    emit("mouseDown", cellId);
  }
};

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.touches.length !== 1) return;

  const touch = e.touches[0];
  const element = document.elementFromPoint(
    touch.clientX,
    touch.clientY
  ) as HTMLElement;
  const cellId = element?.getAttribute("data-cell-id");
  if (cellId) {
    emit("mouseMove", cellId);
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
  emit("mouseUp");
};

// Cell styling
const getCellClasses = (cell: Cell) => {
  const isInCurrentPath = props.currentPath.includes(cell.id);
  const isPathStart = props.currentPath[0] === cell.id;
  const isPathEnd =
    props.currentPath[props.currentPath.length - 1] === cell.id &&
    props.currentPath.length > 1;

  return [
    "aspect-square transition-all duration-300 cursor-pointer relative",
    "flex items-center justify-center",
    {
      "bg-white": !cell.isFilled && !cell.isHighlighted && !isInCurrentPath,
      [props.colors.filledBg]: cell.isFilled && !isInCurrentPath,
      [props.colors.activeBg]: isInCurrentPath,
      [props.colors.highlightBg]: !cell.isNumbered && cell.isHighlighted,
      "shadow-inner": cell.isFilled,
      "border border-gray-300": true,
      "border-t-4 border-t-gray-800": cell.walls?.top,
      "border-r-4 border-r-gray-800": cell.walls?.right,
      "border-b-4 border-b-gray-800": cell.walls?.bottom,
      "border-l-4 border-l-gray-800": cell.walls?.left,
    },
  ];
};

const getNumberedCellClasses = (cell: Cell) => {
  const isInCurrentPath = props.currentPath.includes(cell.id);
  const isPathStart = props.currentPath[0] === cell.id;

  return [
    "rounded-full text-white z-30 relative",
    "flex items-center justify-center text-lg font-bold",
    "border-2 border-white shadow-lg",
    "select-none pointer-events-none",
    "transition-all duration-300",
    {
      "animate-[pop_0.5s_ease-out]": isInCurrentPath,
      "drop-shadow-lg": isInCurrentPath,
    },
  ];
};

// Enhanced touch support setup
onMounted(() => {
  updateCellSize();

  // Add global touch event listeners to prevent scrolling during game interaction
  if (process.client && gridRef.value) {
    const grid = gridRef.value;

    // Prevent default touch behaviors that might interfere with the game
    const preventDefaultTouch = (e: TouchEvent) => {
      if (props.isDrawing) {
        e.preventDefault();
      }
    };

    // Use passive: false to allow preventDefault
    grid.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    grid.addEventListener("touchmove", preventDefaultTouch, { passive: false });

    // Cleanup on unmount
    onUnmounted(() => {
      grid.removeEventListener("touchstart", preventDefaultTouch);
      grid.removeEventListener("touchmove", preventDefaultTouch);
    });
  }
});

watch([windowWidth, () => props.grid], updateCellSize, { immediate: true });

watch(
  () => props.currentPath,
  () => {
    if (pathRef.value) {
      pathLength.value = pathRef.value.getTotalLength();
    }
  },
  { deep: true }
);
</script>

<style scoped>
@keyframes pop {
  0% {
    transform: scale(1);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
  }
  30% {
    transform: scale(1.4);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
  }
}

.path-stretch {
  animation: stretchPath 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes stretchPath {
  0% {
    stroke-width: v-bind('strokeWidth * 0.8 + "px"');
    stroke-dasharray: v-bind("pathLength * 0.4");
    filter: blur(0px);
  }
  100% {
    stroke-width: v-bind('strokeWidth + "px"');
    stroke-dasharray: v-bind("pathLength");
    filter: blur(0px);
  }
}
</style>
