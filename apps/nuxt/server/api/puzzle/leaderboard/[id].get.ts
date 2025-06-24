import { prisma } from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  try {
    const puzzleId = parseInt(getRouterParam(event, 'id') || '0')
    
    if (!puzzleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid puzzle ID'
      })
    }
    
    const leaderboard = await prisma.userScore.findMany({
      where: { puzzleId },
      orderBy: { timeElapsed: 'asc' },
      take: 50, // Top 50 scores
      select: {
        id: true,
        userName: true,
        timeElapsed: true,
        moves: true,
        hintsUsed: true,
        completedAt: true
      }
    })
    
    return leaderboard
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get leaderboard'
    })
  }
})