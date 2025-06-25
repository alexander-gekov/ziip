<script setup lang="ts">
import type { GameColors } from "~/composables/useGameColors";

interface Props {
  colors: GameColors;
  puzzleNumber: number;
  difficulty: "easy" | "medium" | "hard";
  isPracticeMode: boolean;
}

const props = defineProps<Props>();

const isExpanded = ref(false);

const title = computed(() => {
  if (props.isPracticeMode) {
    return `Ziip - ${
      props.difficulty.charAt(0).toUpperCase() + props.difficulty.slice(1)
    }`;
  }
  return `Ziip #${props.puzzleNumber}`;
});
</script>

<template>
  <div class="text-center space-y-2">
    <div class="flex items-center justify-center gap-2">
      <div class="text-3xl">🏁</div>
      <h1 class="text-2xl font-bold dark:text-white text-gray-900">
        {{ title }}
      </h1>
    </div>
    <div class="text-sm text-muted-foreground">
      Connect the numbered dots in order to fill the grid
    </div>
  </div>
</template>
