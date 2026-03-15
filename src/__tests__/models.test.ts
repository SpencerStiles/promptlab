import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

import { getModel, estimateCost, MODELS, type ModelDef } from '../lib/models'

describe('getModel', () => {
  it('returns the correct ModelDef for gpt-4o', () => {
    const model = getModel('gpt-4o')
    expect(model).toBeDefined()
    expect(model!.id).toBe('gpt-4o')
    expect(model!.name).toBe('GPT-4o')
    expect(model!.provider).toBe('openai')
  })

  it('returns undefined for an unknown model ID', () => {
    expect(getModel('unknown-model')).toBeUndefined()
  })

  it('returns the correct ModelDef for claude-sonnet-4-6', () => {
    const model = getModel('claude-sonnet-4-6')
    expect(model).toBeDefined()
    expect(model!.provider).toBe('anthropic')
  })
})

describe('estimateCost', () => {
  it('computes the correct cost for a known model and token counts', () => {
    // gpt-4o: inputCostPer1M=250, outputCostPer1M=1000
    // 1_000_000 prompt + 1_000_000 completion = 250 + 1000 = 1250 cents
    const cost = estimateCost('gpt-4o', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(1250)
  })

  it('computes partial token cost correctly', () => {
    // gpt-4o-mini: inputCostPer1M=15, outputCostPer1M=60
    // 500_000 prompt + 500_000 completion = 7.5 + 30 = 37.5 cents
    const cost = estimateCost('gpt-4o-mini', 500_000, 500_000)
    expect(cost).toBeCloseTo(37.5)
  })

  it('returns 0 for an unknown model', () => {
    expect(estimateCost('nonexistent-model', 1000, 1000)).toBe(0)
  })

  it('returns 0 when both token counts are zero', () => {
    expect(estimateCost('gpt-4o', 0, 0)).toBe(0)
  })
})

describe('MODELS array', () => {
  it('has at least one model', () => {
    expect(MODELS.length).toBeGreaterThan(0)
  })

  it('every model has all required fields', () => {
    for (const model of MODELS) {
      expect(model.id).toBeTruthy()
      expect(model.name).toBeTruthy()
      expect(['openai', 'anthropic']).toContain(model.provider)
      expect(typeof model.contextWindow).toBe('number')
      expect(model.contextWindow).toBeGreaterThan(0)
      expect(typeof model.inputCostPer1M).toBe('number')
      expect(typeof model.outputCostPer1M).toBe('number')
    }
  })

  it('every model ID is unique', () => {
    const ids = MODELS.map((m: ModelDef) => m.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
