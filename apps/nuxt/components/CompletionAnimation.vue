<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { GameColors } from "~/composables/useGameColors";
import ConfettiExplosion from "vue-confetti-explosion";

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

const isOpen = ref(false);
const hasShown = ref(false);
const isExploding = ref(false);

const confettiConfig = {
  particleCount: 200,
  force: 0.8,
  duration: 3000,
  width: 1600,
  colors: ["#FF5733", "#33FF57", "#5733FF", "#FFFF33", "#33FFFF"],
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

watch(
  () => props.isComplete,
  (newIsComplete) => {
    if (newIsComplete && !hasShown.value) {
      isOpen.value = true;
      isExploding.value = true;
      hasShown.value = true;
      setTimeout(() => {
        isOpen.value = false;
        isExploding.value = false;
        emit("animationComplete");
      }, 4000);
    }
    if (!newIsComplete) {
      hasShown.value = false;
      isExploding.value = false;
    }
  }
);

const handleClose = () => {
  isOpen.value = false;
  isExploding.value = false;
  emit("animationComplete");
};
</script>

<template>
  <div
    v-if="isExploding"
    class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
    <ConfettiExplosion v-bind="confettiConfig" />
  </div>

  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <div
        class="absolute -top-8 left-0 right-0 overflow-hidden pointer-events-none">
        <div
          v-for="i in 4"
          :key="`firework-${i}`"
          class="animate-firework"
          :style="{
            position: 'relative',
            left: `${25 + i * 15}%`,
            marginTop: `${10 + (i % 2) * 5}%`,
            animationDelay: `${i * 0.2}s`,
          }">
          <div
            v-for="j in 8"
            :key="`spark-${j}`"
            class="absolute w-1 h-1 rounded-full animate-spark"
            :class="{
              'bg-yellow-300': j % 2 === 0,
              'bg-orange-300': j % 2 !== 0,
            }"
            :style="{
              transform: `rotate(${j * 45}deg) translateX(15px)`,
              animationDelay: `${j * 0.1}s`,
            }" />
        </div>
      </div>

      <DialogHeader class="text-center sm:text-center">
        <div class="relative mb-6 mx-auto">
          <div class="text-7xl animate-bounce-slow">🎉</div>
        </div>

        <DialogTitle class="text-4xl font-bold mb-3 animate-gradient">
          <span
            class="bg-clip-text text-transparent bg-gradient-to-r"
            :style="{
              backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
            }">
            Amazing!
          </span>
        </DialogTitle>

        <div class="space-y-4">
          <div class="text-6xl font-bold text-gray-800 font-mono">
            {{ formatTime(timeElapsed) }}
          </div>
          <p class="text-xl text-gray-700 font-medium">Puzzle Complete!</p>
          <p class="text-sm text-gray-500">
            You've successfully connected all the dots! 🔗
          </p>
          <button
            class="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            :style="{
              backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
            }"
            @click="
              emit('newGame');
              handleClose();
            ">
            New Game
          </button>
        </div>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.animate-firework {
  animation: firework 2s ease-out forwards;
}

.animate-spark {
  animation: spark 1s ease-out forwards;
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}

.animate-gradient {
  animation: gradient 3s ease infinite;
}

@keyframes firework {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes spark {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
