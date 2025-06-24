-- CreateTable
CREATE TABLE "daily_puzzles" (
    "id" SERIAL NOT NULL,
    "puzzleNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "gridSize" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "numberedCells" JSONB NOT NULL,
    "solutionPath" JSONB NOT NULL,
    "walls" JSONB NOT NULL,
    "seed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_scores" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "puzzleId" INTEGER NOT NULL,
    "timeElapsed" INTEGER NOT NULL,
    "moves" INTEGER NOT NULL,
    "hintsUsed" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzle_stats" (
    "id" SERIAL NOT NULL,
    "puzzleId" INTEGER NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION,
    "averageMoves" DOUBLE PRECISION,
    "averageHints" DOUBLE PRECISION,
    "fastestTime" INTEGER,
    "slowestTime" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzle_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzles_puzzleNumber_key" ON "daily_puzzles"("puzzleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzles_date_key" ON "daily_puzzles"("date");

-- CreateIndex
CREATE INDEX "user_scores_puzzleId_timeElapsed_idx" ON "user_scores"("puzzleId", "timeElapsed");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_stats_puzzleId_key" ON "puzzle_stats"("puzzleId");

-- AddForeignKey
ALTER TABLE "user_scores" ADD CONSTRAINT "user_scores_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "daily_puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_stats" ADD CONSTRAINT "puzzle_stats_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "daily_puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
