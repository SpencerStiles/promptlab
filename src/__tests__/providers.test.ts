import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

// We mock the SDKs at the module level so vi.mock hoisting works correctly.
// The actual mock implementations are overridden per-test via mockImplementation.

vi.mock('openai', () => ({
  default: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(),
}))

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const MockOpenAI = vi.mocked(OpenAI)
const MockAnthropic = vi.mocked(Anthropic)

// We need a fresh providers module each test to clear the cached _openai / _anthropic singletons.
// We do this by resetting modules before each test and dynamically re-importing.
beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
  vi.stubEnv('NODE_ENV', 'test')
  MockOpenAI.mockReset()
  MockAnthropic.mockReset()
})

async function getRunCompletion() {
  const mod = await import('../lib/providers')
  return mod.runCompletion
}

const baseOpenAIRequest = {
  model: 'gpt-4o',
  provider: 'openai' as const,
  systemMsg: 'You are helpful.',
  userMsg: 'Hello',
  temperature: 0.7,
  maxTokens: 256,
}

const baseAnthropicRequest = {
  model: 'claude-sonnet-4-6',
  provider: 'anthropic' as const,
  systemMsg: 'You are helpful.',
  userMsg: 'Hello',
  temperature: 0.7,
  maxTokens: 256,
}

describe('runCompletion with openai provider', () => {
  it('returns content, tokens, and durationMs on a successful call', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Hello world' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    })
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseOpenAIRequest)

    expect(result.content).toBe('Hello world')
    expect(result.promptTokens).toBe(10)
    expect(result.completionTokens).toBe(5)
    expect(result.totalTokens).toBe(15)
    expect(typeof result.durationMs).toBe('number')
    expect(result.error).toBeUndefined()
  })

  it('returns error when OPENAI_API_KEY is not set', async () => {
    // Ensure the key is absent
    vi.stubEnv('OPENAI_API_KEY', '')

    const mockCreate = vi.fn().mockRejectedValue(new Error('OPENAI_API_KEY not configured'))
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseOpenAIRequest)

    // The provider wraps errors in { error, content: '' }
    expect(result.content).toBe('')
    expect(result.error).toBeTruthy()
  })

  it('returns error when OpenAI throws an exception', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')

    const mockCreate = vi.fn().mockRejectedValue(new Error('network timeout'))
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseOpenAIRequest)

    expect(result.content).toBe('')
    expect(result.error).toBe('network timeout')
    expect(result.promptTokens).toBe(0)
    expect(result.completionTokens).toBe(0)
    expect(result.totalTokens).toBe(0)
  })

  it('returns empty content when choices[0].message.content is empty', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '' } }],
      usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    })
    MockOpenAI.mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }) as unknown as OpenAI)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseOpenAIRequest)

    // Provider returns content: '' (from the empty response)
    expect(result.content).toBe('')
    // No error thrown — this is what the implementation does
  })
})

describe('runCompletion with anthropic provider', () => {
  it('returns content and tokens on a successful call', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key')

    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Anthropic response' }],
      usage: { input_tokens: 20, output_tokens: 10 },
    })
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseAnthropicRequest)

    expect(result.content).toBe('Anthropic response')
    expect(result.promptTokens).toBe(20)
    expect(result.completionTokens).toBe(10)
    expect(result.totalTokens).toBe(30)
    expect(result.error).toBeUndefined()
  })

  it('returns error when ANTHROPIC_API_KEY is not set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')

    const mockCreate = vi.fn().mockRejectedValue(new Error('ANTHROPIC_API_KEY not configured'))
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseAnthropicRequest)

    expect(result.content).toBe('')
    expect(result.error).toBeTruthy()
  })

  it('returns error when Anthropic SDK throws', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key')

    const mockCreate = vi.fn().mockRejectedValue(new Error('rate limit exceeded'))
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic)

    const runCompletion = await getRunCompletion()
    const result = await runCompletion(baseAnthropicRequest)

    expect(result.content).toBe('')
    expect(result.error).toBe('rate limit exceeded')
  })
})
