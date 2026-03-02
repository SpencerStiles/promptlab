// Plain async data-fetching functions (no 'use server' — safe to call during render)
import { prisma } from './db';
import { logger } from './logger';

export async function getDashboardStats() {
  try {
    const [promptCount, runCount, totalTokens, recentRuns] = await Promise.all([
      prisma.prompt.count(),
      prisma.run.count(),
      prisma.run.aggregate({ _sum: { totalTokens: true } }),
      prisma.run.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { prompt: { select: { name: true } } },
      }),
    ]);
    return {
      promptCount,
      runCount,
      totalTokens: totalTokens._sum.totalTokens ?? 0,
      recentRuns,
    };
  } catch (err) {
    logger.error('Failed in getDashboardStats', { error: err instanceof Error ? err.message : 'Unknown error' });
    return { promptCount: 0, runCount: 0, totalTokens: 0, recentRuns: [] };
  }
}

export async function listPrompts() {
  try {
    return prisma.prompt.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true, runs: true } } },
    });
  } catch (err) {
    logger.error('Failed in listPrompts', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to list prompts');
  }
}

export async function getPrompt(id: string) {
  try {
    return prisma.prompt.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        runs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  } catch (err) {
    logger.error('Failed in getPrompt', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to get prompt');
  }
}
