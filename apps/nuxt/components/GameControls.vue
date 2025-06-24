<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { Undo, Lightbulb, RefreshCw } from "lucide-vue-next";

interface Props {
  canUndo: boolean;
  isComplete: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "undo"): void;
  (e: "hint"): void;
  (e: "clear"): void;
}>();
</script>

<template>
  <div class="flex gap-3 justify-center touch-action-manipulation">
    <Button
      variant="outline"
      :disabled="!canUndo || isComplete"
      class="flex items-center gap-2 px-6 py-2 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-50"
      @click="emit('undo')">
      <LucideUndo :size="16" />
      Undo
    </Button>

    <Button
      variant="outline"
      :disabled="isComplete"
      class="flex items-center gap-2 px-6 py-2 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-50"
      @click="emit('hint')">
      <LucideLightbulb :size="16" />
      Hint
    </Button>

    <Button
      variant="outline"
      class="flex items-center gap-2 px-6 py-2 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-50"
      @click="emit('clear')">
      <LucideRefreshCw :size="16" />
      Clear
    </Button>
  </div>
</template>

<style>
.touch-action-manipulation {
  touch-action: manipulation;
}
</style>
