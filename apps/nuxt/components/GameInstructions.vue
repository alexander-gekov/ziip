<script setup lang="ts">
import type { GameColors } from "~/composables/useGameColors";

interface Props {
  colors: GameColors;
}

defineProps<Props>();

const isExpanded = ref(false);
</script>

<template>
  <ClientOnly>
    <Card class="bg-white border py-0 gap-0 border-gray-200">
      <Button
        variant="ghost"
        @click="isExpanded = !isExpanded"
        class="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-none">
        <span class="font-medium text-gray-900 text-sm">How to play</span>
        <LucideChevronUp v-if="isExpanded" :size="16" />
        <LucideChevronDown v-else :size="16" />
      </Button>

      <div
        v-if="isExpanded"
        class="px-4 pb-3 space-y-3 border-t border-gray-200">
        <div class="flex items-center gap-3 pt-3">
          <div class="flex gap-0.5">
            <div
              class="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
              :style="{ backgroundColor: colors.start }">
              1
            </div>
            <div
              class="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
              :style="{ backgroundColor: colors.start }">
              2
            </div>
            <div
              class="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
              :style="{ backgroundColor: colors.start }">
              3
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-900 leading-tight">
              Connect numbers in sequence, starting from 1
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="w-5 h-5 rounded flex items-center justify-center"
            :style="{ backgroundColor: colors.start }">
            <div
              class="w-3 h-3 rounded"
              :style="{ backgroundColor: colors.end }"></div>
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-900 leading-tight">
              Fill all empty cells to complete the puzzle
            </p>
          </div>
        </div>
      </div>
    </Card>
  </ClientOnly>
</template>
