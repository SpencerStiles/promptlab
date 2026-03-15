import { NextRequest, NextResponse } from 'next/server';
import { runCompletion } from '@/lib/providers';
import { getModel } from '@/lib/models';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { playgroundSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = req.headers.get('x-forwarded-for') ?? req.ip ?? 'unknown';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = playgroundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { model, systemMsg, userMsg, temperature, maxTokens } = parsed.data;

    const modelDef = getModel(model);
    const provider = modelDef?.provider ?? 'openai';

    const result = await runCompletion({
      model,
      provider,
      systemMsg,
      userMsg,
      temperature,
      maxTokens,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      durationMs: result.durationMs,
    });
  } catch (err) {
    logger.error('Failed to handle POST /api/playground', { error: err instanceof Error ? err.message : 'Unknown error' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
