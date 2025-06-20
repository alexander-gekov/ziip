<script setup lang="ts">
import { Button } from "~/components/ui/button";
import type { GameColors } from "~/composables/useGameColors";

interface Props {
  isComplete: boolean;
  colors: GameColors;
  timeElapsed: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "animationComplete"): void;
  (e: "newGame"): void;
}>();

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
</script>

<template>
  <div
    v-if="isComplete"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div
      class="bg-white p-6 rounded-2xl shadow-xl max-w-sm mx-4 w-full space-y-4 text-center">
      <h2 class="text-2xl font-bold text-gray-900">Congratulations!</h2>
      <p class="text-gray-600">
        You completed the puzzle in {{ formatTime(timeElapsed) }}
      </p>
      <div class="flex gap-2">
        <Button
          class="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-xl font-medium"
          @click="emit('newGame')">
          New Game
        </Button>
        <Button
          class="flex-1 text-white py-2 rounded-xl font-medium opacity-80 hover:opacity-100"
          :style="{ background: colors.end }"
          @click="emit('animationComplete')">
          Close
        </Button>
      </div>
    </div>
  </div>
</template>
