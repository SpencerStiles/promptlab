'use server';

import { prisma } from './db';
import { runCompletion } from './providers';
import { resolveTemplate } from './variables';
import { getModel } from './models';
import { revalidatePath } from 'next/cache';
import { logger } from './logger';

// ──────────────────────────────────────────────
// Prompts
// ──────────────────────────────────────────────

export async function createPrompt(data: {
  name: string;
  description?: string;
  content: string;
  systemMsg?: string;
  tags?: string;
}) {
  try {
    const prompt = await prisma.prompt.create({
      data: {
        name: data.name,
        description: data.description ?? '',
        content: data.content,
        systemMsg: data.systemMsg ?? '',
        tags: data.tags ?? '',
      },
    });

    // Create initial version
    await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 1,
        content: data.content,
        systemMsg: data.systemMsg ?? '',
        note: 'Initial version',
      },
    });

    revalidatePath('/');
    revalidatePath(`/prompts/${prompt.id}`);
    return prompt;
  } catch (err) {
    logger.error('Failed in createPrompt', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to create prompt');
  }
}

export async function updatePrompt(
  id: string,
  data: {
    name?: string;
    description?: string;
    content?: string;
    systemMsg?: string;
    tags?: string;
  },
) {
  try {
    const current = await prisma.prompt.findUnique({ where: { id } });
    if (!current) throw new Error('Prompt not found');

    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        name: data.name ?? current.name,
        description: data.description ?? current.description,
        content: data.content ?? current.content,
        systemMsg: data.systemMsg ?? current.systemMsg,
        tags: data.tags ?? current.tags,
      },
    });

    // Auto-create a new version if content or systemMsg changed
    const contentChanged = data.content !== undefined && data.content !== current.content;
    const systemMsgChanged = data.systemMsg !== undefined && data.systemMsg !== current.systemMsg;
    if (contentChanged || systemMsgChanged) {
      const lastVersion = await prisma.promptVersion.findFirst({
        where: { promptId: id },
        orderBy: { version: 'desc' },
      });
      await prisma.promptVersion.create({
        data: {
          promptId: id,
          version: (lastVersion?.version ?? 0) + 1,
          content: data.content ?? current.content,
          systemMsg: data.systemMsg ?? current.systemMsg,
          note: '',
        },
      });
    }

    revalidatePath('/');
    revalidatePath(`/prompts/${id}`);
    return updated;
  } catch (err) {
    logger.error('Failed in updatePrompt', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to update prompt');
  }
}

export async function deletePrompt(id: string) {
  try {
    await prisma.prompt.delete({ where: { id } });
    revalidatePath('/');
  } catch (err) {
    logger.error('Failed in deletePrompt', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to delete prompt');
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

// ──────────────────────────────────────────────
// Runs
// ──────────────────────────────────────────────

export async function executeRun(data: {
  promptId: string;
  versionId?: string;
  model: string;
  variables?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}) {
  try {
    const prompt = await prisma.prompt.findUnique({ where: { id: data.promptId } });
    if (!prompt) throw new Error('Prompt not found');

    const modelDef = getModel(data.model);
    const provider = modelDef?.provider ?? 'openai';
    const variables = data.variables ?? {};
    const resolvedPrompt = resolveTemplate(prompt.content, variables);
    const systemMsg = resolveTemplate(prompt.systemMsg, variables);

    const result = await runCompletion({
      model: data.model,
      provider,
      systemMsg,
      userMsg: resolvedPrompt,
      temperature: data.temperature ?? 0.7,
      maxTokens: data.maxTokens ?? 2048,
    });

    const run = await prisma.run.create({
      data: {
        promptId: data.promptId,
        versionId: data.versionId ?? null,
        model: data.model,
        provider,
        variables: JSON.stringify(variables),
        resolvedPrompt,
        systemMsg,
        response: result.content,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        durationMs: result.durationMs,
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? 2048,
        error: result.error ?? null,
      },
    });

    revalidatePath(`/prompts/${data.promptId}`);
    return run;
  } catch (err) {
    logger.error('Failed in executeRun', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to execute run');
  }
}

export async function rateRun(runId: string, rating: number) {
  try {
    return prisma.run.update({
      where: { id: runId },
      data: { rating },
    });
  } catch (err) {
    logger.error('Failed in rateRun', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to rate run');
  }
}

// ──────────────────────────────────────────────
// Comparison — run same prompt across multiple models
// ──────────────────────────────────────────────

export async function compareModels(data: {
  promptId: string;
  models: string[];
  variables?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}) {
  try {
    const runs = await Promise.all(
      data.models.map((model) =>
        executeRun({
          promptId: data.promptId,
          model,
          variables: data.variables,
          temperature: data.temperature,
          maxTokens: data.maxTokens,
        }),
      ),
    );
    return runs;
  } catch (err) {
    logger.error('Failed in compareModels', { error: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to compare models');
  }
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────

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
    throw new Error(err instanceof Error ? err.message : 'Failed to get dashboard stats');
  }
}
