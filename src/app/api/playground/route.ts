import { NextRequest, NextResponse } from 'next/server';
import { runCompletion } from '@/lib/providers';
import { getModel } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, systemMsg, userMsg, temperature, maxTokens } = body;

    if (!userMsg?.trim()) {
      return NextResponse.json({ error: 'userMsg is required' }, { status: 400 });
    }

    const modelDef = getModel(model ?? 'gpt-4o-mini');
    const provider = modelDef?.provider ?? 'openai';

    const result = await runCompletion({
      model: model ?? 'gpt-4o-mini',
      provider,
      systemMsg: systemMsg ?? '',
      userMsg,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens ?? 2048,
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
