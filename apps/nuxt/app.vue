<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";

useHead({
  link: [{ rel: "icon", type: "image/png", href: "favicon.ico" }],
  script: [
    {
      src: "https://umami.alexandergekov.com/script.js",
      defer: true,
      "data-website-id": "37c004c9-de2d-4c36-842d-195e52f05e15",
    },
  ],
});

const colorMode = useColorMode();
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <NuxtPage />
    <Toaster :theme="colorMode.value === 'dark' ? 'dark' : 'light'" />
  </div>
</template>
