/**
 * Zod validation schemas for API input validation.
 */
import { z } from 'zod';

export const createPromptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required').max(50_000, 'Content exceeds maximum length'),
  systemMsg: z.string().optional(),
  tags: z.string().optional(),
});

export const executeRunSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID is required'),
  versionId: z.string().optional(),
  model: z.string().min(1, 'Model is required'),
  variables: z.record(z.string()).optional(),
  temperature: z.number().min(0, 'Temperature must be >= 0').max(2, 'Temperature must be <= 2').optional(),
  maxTokens: z.number().int().min(1, 'maxTokens must be >= 1').max(32_000, 'maxTokens must be <= 32000').optional(),
});

export const playgroundSchema = z.object({
  model: z.string().optional(),
  systemMsg: z.string().optional(),
  userMsg: z.string().min(1, 'userMsg is required'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32_000).optional(),
});

export const compareModelsSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID is required'),
  models: z.array(z.string()).min(1, 'At least one model is required').max(10, 'Cannot compare more than 10 models'),
  variables: z.record(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32_000).optional(),
});

export const rateRunSchema = z.object({
  runId: z.string().min(1, 'Run ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
});
