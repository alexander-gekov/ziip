<script setup lang="ts">
import { LucideTrophy } from "lucide-vue-next";
import type { GameColors } from "~/composables/useGameColors";
import { formatTime } from "~/utils/format";

interface Props {
  puzzleId: number;
  puzzleNumber: number;
  colors: GameColors;
  timeElapsed: number;
  moves: number;
  hintsUsed: number;
}

const props = defineProps<Props>();

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

const isOpen = ref(false);
const leaderboard = ref<UserScore[]>([]);
const puzzleStats = ref<PuzzleStats | null>(null);
const isLoadingStats = ref(false);

const loadLeaderboardData = async () => {
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
  } finally {
    isLoadingStats.value = false;
  }
};

const getUserRank = (userTime: number): number => {
  if (!leaderboard.value.length) return 1;
  return (
    leaderboard.value.filter((score) => score.timeElapsed < userTime).length + 1
  );
};

watch(isOpen, (newValue) => {
  if (newValue) {
    loadLeaderboardData();
  }
});
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger
      as="button"
      class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
      <LucideTrophy class="w-4 h-4" />
      <span>Leaderboard</span>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-80">
      <DropdownMenuLabel class="font-semibold text-gray-800">
        Ziip #{{ puzzleNumber }} Leaderboard
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <!-- Stats Overview -->
      <div
        v-if="puzzleStats && !isLoadingStats"
        class="grid grid-cols-3 gap-4 text-center p-2">
        <div>
          <div class="text-lg font-bold text-gray-700">
            {{ formatTime(Math.round(puzzleStats.averageTime || 0)) }}
          </div>
          <div class="text-xs text-gray-500">Today's avg</div>
        </div>
        <div>
          <div class="text-lg font-bold text-gray-700">
            {{ puzzleStats.totalPlays }}
          </div>
          <div class="text-xs text-gray-500">Players</div>
        </div>
        <div>
          <div class="text-lg font-bold text-gray-700">
            #{{ getUserRank(timeElapsed) }}
          </div>
          <div class="text-xs text-gray-500">Your rank</div>
        </div>
      </div>

      <DropdownMenuSeparator />

      <!-- Leaderboard List -->
      <div class="max-h-64 overflow-y-auto p-2">
        <div v-if="isLoadingStats" class="text-center text-gray-500 py-2">
          Loading leaderboard...
        </div>
        <div
          v-else-if="leaderboard.length === 0"
          class="text-center text-gray-500 py-2">
          No scores yet. Be the first to complete this puzzle!
        </div>
        <div
          v-else
          v-for="(score, index) in leaderboard.slice(0, 10)"
          :key="score.id"
          class="flex items-center justify-between p-2 rounded-lg text-sm"
          :class="{
            'bg-gray-50': score.timeElapsed === timeElapsed,
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
    </DropdownMenuContent>
  </DropdownMenu>
</template>
