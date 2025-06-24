import { prisma } from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { userName, puzzleId, timeElapsed, moves, hintsUsed } = body
    
    if (!userName || !puzzleId || timeElapsed === undefined || moves === undefined || hintsUsed === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    // Save user score
    const userScore = await prisma.userScore.create({
      data: {
        userName,
        puzzleId,
        timeElapsed,
        moves,
        hintsUsed
      }
    })
    
    // Update puzzle statistics
    const allScores = await prisma.userScore.findMany({
      where: { puzzleId },
      select: {
        timeElapsed: true,
        moves: true,
        hintsUsed: true
      }
    })
    
    const totalPlays = allScores.length
    const averageTime = allScores.reduce((sum, score) => sum + score.timeElapsed, 0) / totalPlays
    const averageMoves = allScores.reduce((sum, score) => sum + score.moves, 0) / totalPlays
    const averageHints = allScores.reduce((sum, score) => sum + score.hintsUsed, 0) / totalPlays
    const fastestTime = Math.min(...allScores.map(score => score.timeElapsed))
    const slowestTime = Math.max(...allScores.map(score => score.timeElapsed))
    
    await prisma.puzzleStats.update({
      where: { puzzleId },
      data: {
        totalPlays,
        averageTime,
        averageMoves,
        averageHints,
        fastestTime,
        slowestTime
      }
    })
    
    return { success: true, scoreId: userScore.id }
  } catch (error) {
    console.error('Error submitting score:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit score'
    })
  }
})