/**
 * Supported AI models and their metadata.
 */

export interface ModelDef {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  contextWindow: number;
  inputCostPer1M: number;  // cents
  outputCostPer1M: number; // cents
}

export const MODELS: ModelDef[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128_000,
    inputCostPer1M: 250,   // $2.50
    outputCostPer1M: 1000, // $10.00
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128_000,
    inputCostPer1M: 15,  // $0.15
    outputCostPer1M: 60, // $0.60
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 1500,  // $15.00
    outputCostPer1M: 7500, // $75.00
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 300,   // $3.00
    outputCostPer1M: 1500, // $15.00
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 80,  // $0.80
    outputCostPer1M: 400, // $4.00
  },
];

export function getModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

export function estimateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const model = getModel(modelId);
  if (!model) return 0;
  return (
    (promptTokens / 1_000_000) * model.inputCostPer1M +
    (completionTokens / 1_000_000) * model.outputCostPer1M
  );
}
