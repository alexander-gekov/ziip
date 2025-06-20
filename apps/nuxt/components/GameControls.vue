<script setup lang="ts">
import { Button } from "~/components/ui/button";

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
  <div class="flex gap-2">
    <Button
      class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 rounded-xl font-medium"
      :disabled="!canUndo || isComplete"
      @click="emit('undo')">
      Undo
    </Button>
    <Button
      class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 rounded-xl font-medium"
      :disabled="isComplete"
      @click="emit('hint')">
      Hint
    </Button>
    <Button
      class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 rounded-xl font-medium"
      :disabled="isComplete"
      @click="emit('clear')">
      Clear
    </Button>
  </div>
</template>
