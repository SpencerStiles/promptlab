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
    inputCostPer1M: 250,
    outputCostPer1M: 1000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128_000,
    inputCostPer1M: 15,
    outputCostPer1M: 60,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16_385,
    inputCostPer1M: 50,
    outputCostPer1M: 150,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 300,
    outputCostPer1M: 1500,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 25,
    outputCostPer1M: 125,
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
