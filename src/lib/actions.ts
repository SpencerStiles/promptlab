'use server';

import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from './db';
import { runCompletion } from './providers';
import { resolveTemplate } from './variables';
import { getModel, estimateCost } from './models';
import { logger } from './logger';
import { authOptions, getUserScope } from './auth';
import { checkRateLimit } from './rate-limit';
import {
  createPromptSchema,
  updatePromptSchema,
  executeRunSchema,
  rateRunSchema,
  compareModelsSchema,
} from './schemas';

// ──────────────────────────────────────────────
// withAction: consistent error handling wrapper
// ──────────────────────────────────────────────

/**
 * withAction: wraps a server action with consistent error handling.
 *
 *  input → validate (caller) → execute fn → log success → return result
 *                                               │
 *                                           [throws]
 *                                               ▼
 *                                    log error with context
 *                                    sanitize Prisma/external errors
 *                                    re-throw as clean Error
 */
async function withAction<T>(
  name: string,
  context: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Sanitize Prisma errors — don't leak schema details to clients
    const message =
      err instanceof Error
        ? err.message.replace(/\bPrismaClientKnownRequestError\b.*/, 'Database error')
        : 'Unknown error';
    logger.error(`Failed in ${name}`, { ...context, error: message });
    throw new Error(message);
  }
}

// ──────────────────────────────────────────────
// Prompts
// ──────────────────────────────────────────────

// Listed here (not only in data.ts) so client components can import a server action
// instead of calling data.ts directly (which bundles Prisma into the browser bundle).
export async function listPrompts() {
  const session = await getServerSession(authOptions);
  const scope = getUserScope(session);
  return withAction('listPrompts', {}, async () =>
    prisma.prompt.findMany({
      where: scope,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true, runs: true } } },
    }),
  );
}

export async function createPrompt(data: {
  name: string;
  description?: string;
  content: string;
  systemMsg?: string;
  tags?: string;
}) {
  const parsed = createPromptSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.toString());
  }
  const input = parsed.data;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  return withAction('createPrompt', { userId: userId ?? 'anonymous' }, async () => {
    const prompt = await prisma.$transaction(async (tx) => {
      const p = await tx.prompt.create({
        data: {
          name: input.name,
          description: input.description,
          content: input.content,
          systemMsg: input.systemMsg,
          tags: input.tags,
          ...(userId ? { userId } : {}),
        },
      });

      await tx.promptVersion.create({
        data: {
          promptId: p.id,
          version: 1,
          content: input.content,
          systemMsg: input.systemMsg,
          note: 'Initial version',
        },
      });

      return p;
    });

    revalidatePath('/');
    revalidatePath(`/prompts/${prompt.id}`);
    return prompt;
  });
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
  const parsed = updatePromptSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.toString());
  }
  const input = parsed.data;

  const session = await getServerSession(authOptions);
  const scope = getUserScope(session);

  return withAction('updatePrompt', { id, userId: scope.userId ?? 'anonymous' }, async () => {
    const current = await prisma.prompt.findUnique({ where: { id, ...scope } });
    if (!current) throw new Error('Prompt not found');

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.prompt.update({
        where: { id, ...scope },
        data: {
          name: input.name ?? current.name,
          description: input.description ?? current.description,
          content: input.content ?? current.content,
          systemMsg: input.systemMsg ?? current.systemMsg,
          tags: input.tags ?? current.tags,
        },
      });

      // Auto-create a new version if content or systemMsg changed
      const contentChanged = input.content !== undefined && input.content !== current.content;
      const systemMsgChanged = input.systemMsg !== undefined && input.systemMsg !== current.systemMsg;
      if (contentChanged || systemMsgChanged) {
        const lastVersion = await tx.promptVersion.findFirst({
          where: { promptId: id },
          orderBy: { version: 'desc' },
        });
        await tx.promptVersion.create({
          data: {
            promptId: id,
            version: (lastVersion?.version ?? 0) + 1,
            content: input.content ?? current.content,
            systemMsg: input.systemMsg ?? current.systemMsg,
            note: '',
          },
        });
      }

      return u;
    });

    revalidatePath('/');
    revalidatePath(`/prompts/${id}`);
    return updated;
  });
}

export async function deletePrompt(id: string) {
  const session = await getServerSession(authOptions);
  const scope = getUserScope(session);

  return withAction('deletePrompt', { id, userId: scope.userId ?? 'anonymous' }, async () => {
    await prisma.prompt.delete({ where: { id, ...scope } });
    revalidatePath('/');
  });
}

// ──────────────────────────────────────────────
// Runs
// ──────────────────────────────────────────────

export async function executeRun(
  data: {
    promptId: string;
    versionId?: string;
    model: string;
    variables?: Record<string, string>;
    temperature?: number;
    maxTokens?: number;
  },
  _skipRateLimit = false,
) {
  const parsed = executeRunSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.toString());
  }
  const input = parsed.data;

  // Rate limit check (skip when called internally from compareModels)
  if (!_skipRateLimit) {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'unknown';
    const { allowed } = checkRateLimit(ip);
    if (!allowed) throw new Error('Rate limit exceeded. Please wait before running more prompts.');
  }

  const session = await getServerSession(authOptions);
  const scope = getUserScope(session);

  return withAction('executeRun', { promptId: input.promptId, model: input.model, userId: scope.userId ?? 'anonymous' }, async () => {
    const prompt = await prisma.prompt.findUnique({ where: { id: input.promptId, ...scope } });
    if (!prompt) throw new Error('Prompt not found');

    const modelDef = getModel(input.model);
    const provider = modelDef?.provider ?? 'openai';
    const variables = input.variables;
    const resolvedPrompt = resolveTemplate(prompt.content, variables);
    const systemMsg = resolveTemplate(prompt.systemMsg, variables);

    const result = await runCompletion({
      model: input.model,
      provider,
      systemMsg,
      userMsg: resolvedPrompt,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    });

    const run = await prisma.run.create({
      data: {
        promptId: input.promptId,
        versionId: input.versionId ?? null,
        model: input.model,
        provider,
        variables: JSON.stringify(variables),
        resolvedPrompt,
        systemMsg,
        response: result.content,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        durationMs: result.durationMs,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        error: result.error ?? null,
      },
    });

    const cost = estimateCost(input.model, result.promptTokens, result.completionTokens);
    logger.info('executeRun completed', {
      promptId: input.promptId,
      model: input.model,
      tokens: result.totalTokens,
      cost,
      durationMs: result.durationMs,
      userId: scope.userId ?? 'anonymous',
    });

    revalidatePath(`/prompts/${input.promptId}`);
    return run;
  });
}

export async function rateRun(runId: string, rating: number) {
  const parsed = rateRunSchema.safeParse({ runId, rating });
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.toString());
  }
  const input = parsed.data;

  const session = await getServerSession(authOptions);
  const scope = getUserScope(session);

  return withAction('rateRun', { runId: input.runId, userId: scope.userId ?? 'anonymous' }, async () => {
    // If auth is enabled, verify the run belongs to a prompt owned by the user
    if (scope.userId) {
      const run = await prisma.run.findUnique({
        where: { id: input.runId },
        include: { prompt: { select: { userId: true } } },
      });
      if (!run) throw new Error('Run not found');
      if (run.prompt.userId !== null && run.prompt.userId !== scope.userId) {
        throw new Error('Run not found');
      }
    }

    return prisma.run.update({
      where: { id: input.runId },
      data: { rating: input.rating },
    });
  });
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
  const parsed = compareModelsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.toString());
  }
  const input = parsed.data;

  // Rate limit check once at entry point — compareModels counts as 1 token
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'unknown';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) throw new Error('Rate limit exceeded. Please wait before running more prompts.');

  const results = await Promise.allSettled(
    input.models.map((model) =>
      executeRun(
        {
          promptId: input.promptId,
          model,
          variables: input.variables,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
        },
        true, // skip per-call rate limit — we already checked above
      ),
    ),
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // Normalize error case to the same shape as a Run so UI consumers work without type guards
    const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
    return {
      id: `error-${i}`,
      model: input.models[i],
      provider: 'unknown' as const,
      promptId: input.promptId,
      versionId: null,
      variables: '{}',
      resolvedPrompt: '',
      systemMsg: '',
      response: '',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      durationMs: 0,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      error: errorMsg,
      rating: null,
      notes: '',
      createdAt: new Date(),
    };
  });
}
