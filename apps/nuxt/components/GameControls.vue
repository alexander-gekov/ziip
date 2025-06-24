<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { Undo, Lightbulb, RefreshCw, RotateCcw } from "lucide-vue-next";

interface Props {
  isComplete: boolean;
  canUndo: boolean;
  isPracticeMode?: boolean;
  gameColors: {
    start: string;
    end: string;
    filledBg: string;
    highlightBg: string;
    activeBg: string;
    startBg: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "undo"): void;
  (e: "hint"): void;
  (e: "clear"): void;
  (e: "new-game"): void;
  (e: "solve"): void;
}>();

const handleUndo = () => {
  emit("undo");
};

const handleHint = () => {
  emit("hint");
};

const handleClear = () => {
  emit("clear");
};

const handleNewGame = () => {
  emit("new-game");
};

const handleSolve = () => {
  emit("solve");
};
</script>

<template>
  <div class="flex flex-col space-y-4">
    <!-- Main Game Controls -->
    <div class="flex gap-2">
      <Button
        variant="outline"
        class="flex-1"
        :disabled="!props.canUndo || props.isComplete"
        @click="handleUndo">
        <LucideUndo class="w-4 h-4 mr-2" />
        Undo
      </Button>
      <Button
        variant="outline"
        class="flex-1"
        :disabled="props.isComplete"
        @click="handleHint">
        <LucideLightbulb class="w-4 h-4 mr-2" />
        Hint
      </Button>
      <Button
        variant="outline"
        class="flex-1"
        :disabled="props.isComplete"
        @click="handleClear">
        <LucideRotateCcw class="w-4 h-4 mr-2" />
        Clear
      </Button>
    </div>

    <!-- Practice Mode Controls -->
    <div v-if="props.isPracticeMode" class="space-y-2">
      <Button
        @click="handleNewGame"
        class="w-full text-white py-1 rounded-xl font-medium opacity-80 hover:opacity-100"
        :style="{ background: props.gameColors.end }">
        <LucideRefreshCw class="w-4 h-4 mr-2" />
        New Game
      </Button>
      <Button
        @click="handleSolve"
        class="w-full text-white py-1 rounded-xl font-medium opacity-80 hover:opacity-100"
        :style="{ background: props.gameColors.start }">
        Solve
      </Button>
    </div>

    <!-- Practice Mode Label -->
    <div v-if="props.isPracticeMode" class="text-center text-sm text-gray-500">
      Practice Mode - Scores won't be saved
    </div>
  </div>
</template>

<style>
.touch-action-manipulation {
  touch-action: manipulation;
}
</style>
