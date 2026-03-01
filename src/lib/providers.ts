/**
 * AI provider abstraction — routes requests to OpenAI or Anthropic.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface CompletionRequest {
  model: string;
  provider: 'openai' | 'anthropic';
  systemMsg: string;
  userMsg: string;
  temperature: number;
  maxTokens: number;
}

interface CompletionResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  error?: string;
}

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
  }
  return _openai;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });
  }
  return _anthropic;
}

async function callOpenAI(req: CompletionRequest): Promise<CompletionResult> {
  const start = Date.now();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (req.systemMsg) messages.push({ role: 'system', content: req.systemMsg });
  messages.push({ role: 'user', content: req.userMsg });

  const response = await getOpenAI().chat.completions.create({
    model: req.model,
    messages,
    temperature: req.temperature,
    max_tokens: req.maxTokens,
  });

  return {
    content: response.choices[0]?.message?.content ?? '',
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
    durationMs: Date.now() - start,
  };
}

async function callAnthropic(req: CompletionRequest): Promise<CompletionResult> {
  const start = Date.now();

  const message = await getAnthropic().messages.create({
    model: req.model,
    max_tokens: req.maxTokens,
    system: req.systemMsg || undefined,
    messages: [{ role: 'user', content: req.userMsg }],
    temperature: req.temperature,
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;

  return {
    content: text,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    totalTokens: inputTokens + outputTokens,
    durationMs: Date.now() - start,
  };
}

export async function runCompletion(req: CompletionRequest): Promise<CompletionResult> {
  try {
    if (req.provider === 'anthropic') {
      return await callAnthropic(req);
    }
    return await callOpenAI(req);
  } catch (err) {
    return {
      content: '',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      durationMs: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
