import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

import {
  createPromptSchema,
  executeRunSchema,
  playgroundSchema,
  compareModelsSchema,
  rateRunSchema,
} from '../lib/schemas'

describe('createPromptSchema', () => {
  it('passes for valid input', () => {
    const result = createPromptSchema.safeParse({ name: 'My Prompt', content: 'Hello {{name}}' })
    expect(result.success).toBe(true)
  })

  it('fails when name is missing', () => {
    const result = createPromptSchema.safeParse({ content: 'Hello' })
    expect(result.success).toBe(false)
  })

  it('fails when content is empty', () => {
    const result = createPromptSchema.safeParse({ name: 'My Prompt', content: '' })
    expect(result.success).toBe(false)
  })

  it('fails when content exceeds max length', () => {
    const result = createPromptSchema.safeParse({ name: 'My Prompt', content: 'x'.repeat(50_001) })
    expect(result.success).toBe(false)
  })

  it('passes with optional fields included', () => {
    const result = createPromptSchema.safeParse({
      name: 'My Prompt',
      content: 'Hello',
      description: 'A test prompt',
      systemMsg: 'You are helpful.',
      tags: 'test,example',
    })
    expect(result.success).toBe(true)
  })
})

describe('executeRunSchema', () => {
  it('passes for valid input', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o' })
    expect(result.success).toBe(true)
  })

  it('fails when model is missing', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc' })
    expect(result.success).toBe(false)
  })

  it('fails when temperature is greater than 2', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', temperature: 2.1 })
    expect(result.success).toBe(false)
  })

  it('fails when temperature is less than 0', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', temperature: -0.1 })
    expect(result.success).toBe(false)
  })

  it('fails when maxTokens exceeds 32000', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', maxTokens: 32_001 })
    expect(result.success).toBe(false)
  })

  it('fails when maxTokens is less than 1', () => {
    const result = executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', maxTokens: 0 })
    expect(result.success).toBe(false)
  })

  it('passes with temperature exactly at boundary values (0 and 2)', () => {
    expect(executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', temperature: 0 }).success).toBe(true)
    expect(executeRunSchema.safeParse({ promptId: 'abc', model: 'gpt-4o', temperature: 2 }).success).toBe(true)
  })
})

describe('playgroundSchema', () => {
  it('passes for valid input', () => {
    const result = playgroundSchema.safeParse({ model: 'gpt-4o', userMsg: 'Hello!' })
    expect(result.success).toBe(true)
  })

  it('fails when userMsg is missing', () => {
    const result = playgroundSchema.safeParse({ model: 'gpt-4o' })
    expect(result.success).toBe(false)
  })

  it('fails when userMsg is empty', () => {
    const result = playgroundSchema.safeParse({ userMsg: '' })
    expect(result.success).toBe(false)
  })

  it('passes with all optional fields set', () => {
    const result = playgroundSchema.safeParse({
      model: 'gpt-4o',
      systemMsg: 'You are helpful.',
      userMsg: 'Tell me a joke',
      temperature: 0.7,
      maxTokens: 512,
    })
    expect(result.success).toBe(true)
  })
})

describe('compareModelsSchema', () => {
  it('passes for valid input', () => {
    const result = compareModelsSchema.safeParse({ promptId: 'abc', models: ['gpt-4o', 'gpt-4o-mini'] })
    expect(result.success).toBe(true)
  })

  it('fails when models array is empty', () => {
    const result = compareModelsSchema.safeParse({ promptId: 'abc', models: [] })
    expect(result.success).toBe(false)
  })

  it('fails when models array has more than 10 entries', () => {
    const models = Array.from({ length: 11 }, (_, i) => `model-${i}`)
    const result = compareModelsSchema.safeParse({ promptId: 'abc', models })
    expect(result.success).toBe(false)
  })

  it('passes with exactly 10 models', () => {
    const models = Array.from({ length: 10 }, (_, i) => `model-${i}`)
    const result = compareModelsSchema.safeParse({ promptId: 'abc', models })
    expect(result.success).toBe(true)
  })
})

describe('rateRunSchema', () => {
  it('passes for a rating of 1', () => {
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 1 }).success).toBe(true)
  })

  it('passes for a rating of 5', () => {
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 5 }).success).toBe(true)
  })

  it('passes for ratings 2, 3, 4', () => {
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 2 }).success).toBe(true)
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 3 }).success).toBe(true)
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 4 }).success).toBe(true)
  })

  it('fails for rating of 0', () => {
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 0 }).success).toBe(false)
  })

  it('fails for rating of 6', () => {
    expect(rateRunSchema.safeParse({ runId: 'run1', rating: 6 }).success).toBe(false)
  })
})
