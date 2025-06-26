<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from "vue-sonner";

const props = defineProps<ToasterProps>();

const colorMode = useColorMode();
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    }" />
</template>
