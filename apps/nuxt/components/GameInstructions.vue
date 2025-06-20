<script setup lang="ts">
import type { GameColors } from "~/composables/useGameColors";

interface Props {
  colors: GameColors;
}

defineProps<Props>();
</script>

<template>
  <div class="space-y-2 text-sm text-gray-600">
    <h2 class="font-semibold text-gray-900">How to Play:</h2>
    <ul class="list-disc pl-5 space-y-1">
      <li>Connect numbered cells in ascending order</li>
      <li>Fill all empty cells with your path</li>
      <li>
        Path cannot cross itself or go through walls
        <div
          class="inline-block w-2 h-2 mx-1 rounded-full"
          :style="{ background: colors.filledBg }" />
      </li>
      <li>Use hints if you get stuck!</li>
    </ul>
  </div>
</template>
