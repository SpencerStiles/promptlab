/**
 * env.ts — Validate required environment variables at startup.
 * Import `env` from here instead of process.env directly.
 */
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Authentication (NextAuth)
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
}).refine(
  (data) => !data.GITHUB_CLIENT_ID || !!data.NEXTAUTH_SECRET,
  { message: 'NEXTAUTH_SECRET is required when GITHUB_CLIENT_ID is set', path: ['NEXTAUTH_SECRET'] }
);

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
