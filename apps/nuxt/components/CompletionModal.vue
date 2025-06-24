<script setup lang="ts">
import { toast } from "vue-sonner";
import ConfettiExplosion from "vue-confetti-explosion";
import type { GameColors } from "~/composables/useGameColors";
import { formatTime } from "~/utils/format";

interface Props {
  isComplete: boolean;
  colors: GameColors;
  timeElapsed: number;
  moves: number;
  hintsUsed: number;
  puzzleId: number;
  puzzleNumber: number;
  isPracticeMode: boolean;
}

interface UserScore {
  id: number;
  userName: string;
  timeElapsed: number;
  moves: number;
  hintsUsed: number;
  completedAt: string;
}

interface PuzzleStats {
  totalPlays: number;
  averageTime: number | null;
  fastestTime: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "animationComplete"): void;
  (e: "newGame"): void;
}>();

const isOpen = ref(false);
const hasShown = ref(false);
const isExploding = ref(false);
const userName = ref("");
const isSubmitting = ref(false);
const hasSubmitted = ref(false);
const showLeaderboard = ref(false);
const leaderboard = ref<UserScore[]>([]);
const puzzleStats = ref<PuzzleStats | null>(null);
const isLoadingStats = ref(false);

const confettiConfig = {
  particleCount: 200,
  force: 0.8,
  duration: 3000,
  width: 1600,
  colors: ["#FF5733", "#33FF57", "#5733FF", "#FFFF33", "#33FFFF"],
};

watch(
  () => props.isComplete,
  (newIsComplete) => {
    if (newIsComplete && !hasShown.value) {
      isOpen.value = true;
      isExploding.value = true;
      hasShown.value = true;
      loadPuzzleStats();

      // Auto-hide confetti after 4 seconds but keep modal open
      setTimeout(() => {
        isExploding.value = false;
      }, 4000);
    }
    if (!newIsComplete) {
      hasShown.value = false;
      isExploding.value = false;
      hasSubmitted.value = false;
      showLeaderboard.value = false;
    }
  }
);

const loadPuzzleStats = async () => {
  if (!props.puzzleId) return;

  isLoadingStats.value = true;
  try {
    const [statsResponse, leaderboardResponse] = await Promise.all([
      $fetch(`/api/puzzle/today`),
      $fetch(`/api/puzzle/leaderboard/${props.puzzleId}`),
    ]);

    puzzleStats.value = statsResponse.stats;
    leaderboard.value = leaderboardResponse;
  } catch (error) {
    console.error("Error loading puzzle stats:", error);
    toast.error("Failed to load puzzle statistics");
  } finally {
    isLoadingStats.value = false;
  }
};

const submitScore = async () => {
  if (!userName.value.trim()) {
    toast.error("Please enter your name");
    return;
  }

  if (hasSubmitted.value) return;

  isSubmitting.value = true;
  try {
    await $fetch("/api/puzzle/score", {
      method: "POST",
      body: {
        userName: userName.value.trim(),
        puzzleId: props.puzzleId,
        timeElapsed: props.timeElapsed,
        moves: props.moves,
        hintsUsed: props.hintsUsed,
      },
    });

    hasSubmitted.value = true;
    toast.success("Score submitted successfully!");

    // Reload stats and leaderboard
    await loadPuzzleStats();
  } catch (error) {
    console.error("Error submitting score:", error);
    toast.error("Failed to submit score");
  } finally {
    isSubmitting.value = false;
  }
};

const downloadScreenshot = async () => {
  try {
    // Find the game grid element
    const gameGrid = document.querySelector("[data-game-grid]") as HTMLElement;
    if (!gameGrid) {
      toast.error("Could not find game grid for screenshot");
      return;
    }

    // Create a clone of the grid to avoid modifying the original
    const gridClone = gameGrid.cloneNode(true) as HTMLElement;

    // Create a temporary container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.appendChild(gridClone);
    document.body.appendChild(container);

    // Use html2canvas to capture the grid
    const html2canvas = await import("html2canvas");
    const canvas = await html2canvas.default(gridClone, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      removeContainer: true,
      onclone: (doc, element) => {
        // Convert all colors to RGB to avoid oklch issues
        const elements = element.getElementsByTagName("*");
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const computedStyle = getComputedStyle(el);
          el.style.backgroundColor = computedStyle.backgroundColor;
          el.style.color = computedStyle.color;
          el.style.borderColor = computedStyle.borderColor;
        }
      },
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Create download link
    const link = document.createElement("a");
    link.download = `ziip-${props.puzzleNumber}-${formatTime(
      props.timeElapsed
    )}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast.success("Screenshot downloaded!");
  } catch (error) {
    console.error("Error downloading screenshot:", error);
    toast.error("Failed to download screenshot");
  }
};

const shareResult = async () => {
  const shareText = `🎯 Ziip #${props.puzzleNumber} - ${formatTime(
    props.timeElapsed
  )}

${
  props.hintsUsed === 0
    ? "🏆 Perfect solve!"
    : `💡 ${props.hintsUsed} hint${props.hintsUsed > 1 ? "s" : ""} used`
}
🔢 ${props.moves} moves
⚡ ${puzzleStats.value?.totalPlays || 0} players completed today

Play at ziip.fun`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Ziip #${props.puzzleNumber}`,
        text: shareText,
        url: "https://ziip.fun",
      });
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        copyToClipboard();
      }
    }
  } else {
    copyToClipboard();
  }
};

const copyToClipboard = () => {
  const shareText = `🎯 Ziip #${props.puzzleNumber} - ${formatTime(
    props.timeElapsed
  )}

${
  props.hintsUsed === 0
    ? "🏆 Perfect solve!"
    : `💡 ${props.hintsUsed} hint${props.hintsUsed > 1 ? "s" : ""} used`
}
🔢 ${props.moves} moves
⚡ ${puzzleStats.value?.totalPlays || 0} players completed today

Play at ziip.fun`;

  navigator.clipboard
    .writeText(shareText)
    .then(() => {
      toast.success("Result copied to clipboard!");
    })
    .catch(() => {
      toast.error("Failed to copy to clipboard");
    });
};

const handleClose = () => {
  isOpen.value = false;
  isExploding.value = false;
  emit("animationComplete");
};

const getUserRank = (userTime: number): number => {
  if (!leaderboard.value.length) return 1;
  return (
    leaderboard.value.filter((score) => score.timeElapsed < userTime).length + 1
  );
};
</script>

<template>
  <div
    v-if="isExploding"
    class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
    <ConfettiExplosion v-bind="confettiConfig" />
  </div>

  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader class="text-center sm:text-center">
        <!-- Practice Mode -->
        <template v-if="isPracticeMode">
          <div class="relative mb-4 mx-auto">
            <div class="text-6xl animate-bounce-slow">🎉</div>
          </div>

          <div
            class="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r"
            :style="{
              backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
            }">
            Amazing!
          </div>

          <div class="text-5xl font-bold text-gray-800 font-mono mb-6">
            {{ formatTime(timeElapsed) }}
          </div>

          <div class="text-2xl font-bold text-gray-800 mb-4">
            Puzzle Complete!
          </div>

          <div class="text-lg text-gray-600 mb-8">
            You've successfully connected all the dots! 🔗
          </div>

          <Button
            class="w-full py-3 px-4 font-semibold text-white"
            :style="{
              backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
            }"
            @click="
              emit('newGame');
              handleClose();
            ">
            New Game
          </Button>
        </template>

        <!-- Daily Challenge Mode -->
        <template v-else>
          <div class="relative mb-4 mx-auto">
            <div class="text-6xl animate-bounce-slow">🎉</div>
          </div>

          <DialogTitle class="text-3xl font-bold mb-2">
            <span
              class="bg-clip-text text-transparent bg-gradient-to-r"
              :style="{
                backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
              }">
              Ziip #{{ puzzleNumber }}
            </span>
          </DialogTitle>

          <div class="text-lg text-gray-600 mb-6">You're crushing it!</div>

          <!-- Performance Stats -->
          <div
            class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-6">
            <div class="text-5xl font-bold text-gray-800 font-mono mb-2">
              {{ formatTime(timeElapsed) }}
            </div>
            <div class="text-sm text-gray-600 mb-4">
              {{
                hintsUsed > 0
                  ? `with ${hintsUsed} backtrack${hintsUsed > 1 ? "s" : ""}`
                  : "Perfect solve!"
              }}
            </div>

            <!-- Today's Stats -->
            <div
              v-if="puzzleStats && !isLoadingStats"
              class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-700">
                  {{ formatTime(Math.round(puzzleStats.averageTime || 0)) }}
                </div>
                <div class="text-xs text-gray-500">Today's avg</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-700">
                  {{ puzzleStats.totalPlays }}
                </div>
                <div class="text-xs text-gray-500">Players</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-700">
                  #{{ getUserRank(timeElapsed) }}
                </div>
                <div class="text-xs text-gray-500">Your rank</div>
              </div>
            </div>

            <div v-else-if="isLoadingStats" class="text-center text-gray-500">
              Loading stats...
            </div>
          </div>

          <!-- Name Input & Submit -->
          <div v-if="!hasSubmitted" class="space-y-4 mb-6">
            <div>
              <Label for="userName" class="text-sm font-medium text-gray-700"
                >Share your name for the leaderboard</Label
              >
              <Input
                id="userName"
                v-model="userName"
                placeholder="Enter your name"
                class="mt-1"
                @keyup.enter="submitScore"
                :disabled="isSubmitting" />
            </div>
            <Button
              @click="submitScore"
              :disabled="!userName.trim() || isSubmitting"
              class="w-full"
              :style="{
                backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
              }">
              {{ isSubmitting ? "Submitting..." : "Add to Leaderboard" }}
            </Button>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <Button
              variant="outline"
              @click="downloadScreenshot"
              class="flex flex-col h-min items-center py-3">
              <div class="text-2xl mb-1">📸</div>
              <div class="text-xs">Screenshot</div>
            </Button>
            <Button
              variant="outline"
              @click="shareResult"
              class="flex flex-col h-min items-center py-3">
              <div class="text-2xl mb-1">📤</div>
              <div class="text-xs">Share</div>
            </Button>
            <Button
              variant="outline"
              @click="showLeaderboard = !showLeaderboard"
              class="flex flex-col h-min items-center py-3">
              <div class="text-2xl mb-1">🏆</div>
              <div class="text-xs">Leaderboard</div>
            </Button>
          </div>

          <!-- Leaderboard -->
          <div v-if="showLeaderboard" class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-gray-800 mb-3">
              Today's Leaderboard
            </h3>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="(score, index) in leaderboard.slice(0, 10)"
                :key="score.id"
                class="flex items-center justify-between p-2 bg-white rounded-lg text-sm"
                :class="{
                  'ring-2 ring-orange-300':
                    score.timeElapsed === timeElapsed &&
                    score.userName === userName,
                }">
                <div class="flex items-center space-x-3">
                  <div class="w-6 text-center font-medium text-gray-600">
                    {{ index + 1 }}
                  </div>
                  <div class="font-medium">{{ score.userName }}</div>
                </div>
                <div class="text-gray-600">
                  {{ formatTime(score.timeElapsed) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Connection Display -->
          <div v-if="hasSubmitted" class="mb-6">
            <div
              class="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
                <div
                  class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              {{ puzzleStats?.totalPlays || 0 }} connections played
            </div>
          </div>

          <!-- New Game Button -->
          <Button
            class="w-full py-3 px-4 font-semibold text-white"
            :style="{
              backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
            }"
            @click="
              emit('newGame');
              handleClose();
            ">
            Play Unlimited Mode
          </Button>
        </template>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 2s infinite;
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
</style>
