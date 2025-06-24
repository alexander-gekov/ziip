<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";

useHead({
  link: [{ rel: "icon", type: "image/png", href: "favicon.ico" }],
});
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <NuxtPage />
    <Toaster />
  </div>
</template>
