import { z } from 'zod';

export const createPromptSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(''),
  content: z.string().min(1).max(50_000),
  systemMsg: z.string().max(10_000).optional().default(''),
  tags: z.string().max(500).optional().default(''),
});

export const updatePromptSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(50_000).optional(),
  systemMsg: z.string().max(10_000).optional(),
  tags: z.string().max(500).optional(),
});

export const executeRunSchema = z.object({
  promptId: z.string().min(1),
  versionId: z.string().optional(),
  model: z.string().min(1),
  variables: z.record(z.string()).optional().default({}),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(32_000).optional().default(2048),
});

export const rateRunSchema = z.object({
  runId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

export const compareModelsSchema = z.object({
  promptId: z.string().min(1),
  models: z.array(z.string().min(1)).min(1).max(10),
  variables: z.record(z.string()).optional().default({}),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(32_000).optional().default(2048),
});

export const playgroundSchema = z.object({
  model: z.string().min(1),
  systemMsg: z.string().max(10_000).optional().default(''),
  userMsg: z.string().min(1).max(50_000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(32_000).optional().default(2048),
});
