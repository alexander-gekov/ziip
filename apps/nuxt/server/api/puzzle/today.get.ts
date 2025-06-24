import { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma";
import { generateLevel } from "~/utils/levelGenerator";
import type { Level } from "~/utils/levelGenerator";

export default defineEventHandler(async (event) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today's puzzle exists
    let puzzle = await prisma.dailyPuzzle.findUnique({
      where: { date: today },
      include: { stats: true },
    });

    if (!puzzle) {
      // Generate new puzzle for today
      const seed =
        today.getDate() + today.getMonth() * 31 + today.getFullYear() * 365;
      const level = generateLevel("easy", seed);

      // Get the next puzzle number
      const lastPuzzle = await prisma.dailyPuzzle.findFirst({
        orderBy: { puzzleNumber: "desc" },
      });
      const nextPuzzleNumber = (lastPuzzle?.puzzleNumber || 0) + 1;

      // Create new puzzle in database
      puzzle = await prisma.dailyPuzzle.create({
        data: {
          puzzleNumber: nextPuzzleNumber,
          date: today,
          gridSize: level.gridSize,
          difficulty: level.difficulty,
          numberedCells: level.numberedCells as unknown as Prisma.JsonArray,
          solutionPath: level.solutionPath as unknown as Prisma.JsonArray,
          walls: level.walls as unknown as Prisma.JsonArray,
          seed: level.seed,
          stats: {
            create: {
              totalPlays: 0,
            },
          },
        },
        include: { stats: true },
      });
    }

    if (!puzzle) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create puzzle",
      });
    }

    // Return the puzzle with parsed JSON fields
    return {
      id: puzzle.id,
      puzzleNumber: puzzle.puzzleNumber,
      date: puzzle.date,
      gridSize: puzzle.gridSize,
      difficulty: puzzle.difficulty,
      numberedCells: puzzle.numberedCells,
      solutionPath: puzzle.solutionPath,
      walls: puzzle.walls,
      seed: puzzle.seed,
      stats: puzzle.stats,
    };
  } catch (error) {
    console.error("Error getting today's puzzle:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to get today's puzzle",
    });
  }
});
