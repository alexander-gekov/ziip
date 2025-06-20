<script setup lang="ts">
import type { GameColors } from "~/composables/useGameColors";

interface Cell {
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

interface Props {
  grid: Cell[][];
  currentPath: string[];
  isDrawing: boolean;
  isComplete: boolean;
  showCompletionAnimation: boolean;
  colors: GameColors;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "mouseDown", cellId: string): void;
  (e: "mouseMove", cellId: string): void;
  (e: "mouseUp"): void;
  (e: "mouseLeave"): void;
}>();
</script>

<template>
  <div
    class="grid w-full h-full gap-0.5 bg-gray-200 p-0.5 rounded-xl"
    :style="{
      gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
    }"
    @mouseleave="emit('mouseLeave')"
    @mouseup="emit('mouseUp')">
    <div v-for="row in grid" :key="row[0].row" class="contents">
      <div
        v-for="cell in row"
        :key="cell.id"
        class="relative bg-white flex items-center justify-center select-none"
        :class="{
          'cursor-pointer': !isComplete,
          'border-t-2': cell.walls.top,
          'border-r-2': cell.walls.right,
          'border-b-2': cell.walls.bottom,
          'border-l-2': cell.walls.left,
        }"
        :style="{
          backgroundColor: cell.isFilled ? colors.filledBg : 'white',
          borderColor: 'rgb(55, 65, 81)',
        }"
        @mousedown="emit('mouseDown', cell.id)"
        @mousemove="emit('mouseMove', cell.id)">
        <div
          v-if="cell.isNumbered"
          class="absolute inset-1 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base"
          :style="{
            background:
              cell.number === 1
                ? colors.start
                : currentPath.includes(cell.id)
                ? colors.end
                : 'rgb(107, 114, 128)',
            opacity: currentPath.includes(cell.id) ? 1 : 0.8,
          }">
          {{ cell.number }}
        </div>
        <div
          v-if="cell.isPath && !cell.isNumbered"
          class="absolute inset-2.5 rounded-full"
          :style="{
            background: colors.filledBg,
            opacity: currentPath.includes(cell.id) ? 1 : 0.5,
          }" />
      </div>
    </div>
  </div>
</template>
