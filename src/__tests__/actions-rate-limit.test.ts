import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

// Mock all dependencies so we can isolate the rate-limit enforcement path
vi.mock('@/lib/db', () => ({ prisma: {} }))
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: vi.fn(() => ({})) }))
vi.mock('next-auth/providers/github', () => ({ default: vi.fn(() => ({ id: 'github', type: 'oauth' })) }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// headers() mock — returns an object with a .get() method
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: () => '1.2.3.4' }),
}))

// Rate limiter mock — default to allowed; individual tests override this
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 19, resetAt: 0, limit: 20 }),
}))

import { checkRateLimit } from '@/lib/rate-limit'
const mockCheckRateLimit = vi.mocked(checkRateLimit)

describe('executeRun rate-limit enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: 0, limit: 20 })
  })

  it('throws "Rate limit exceeded" when checkRateLimit returns allowed: false', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000, limit: 20 })

    const { executeRun } = await import('@/lib/actions')
    await expect(
      executeRun({ promptId: 'abc', model: 'gpt-4o' }),
    ).rejects.toThrow('Rate limit exceeded')
  })

  it('calls checkRateLimit with the IP from x-forwarded-for', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue({ get: (h: string) => (h === 'x-forwarded-for' ? '9.9.9.9' : null) } as ReturnType<typeof import('next/headers').headers> extends Promise<infer T> ? T : never)

    // Will fail after rate check passes (no prisma mock for findUnique), but that's fine —
    // we just need to verify checkRateLimit was called with the right IP before the DB call.
    const { executeRun } = await import('@/lib/actions')
    await expect(executeRun({ promptId: 'abc', model: 'gpt-4o' })).rejects.toThrow()
    expect(mockCheckRateLimit).toHaveBeenCalledWith('9.9.9.9')
  })
})

describe('compareModels rate-limit enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: 0, limit: 20 })
  })

  it('throws "Rate limit exceeded" when checkRateLimit returns allowed: false', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000, limit: 20 })

    const { compareModels } = await import('@/lib/actions')
    await expect(
      compareModels({ promptId: 'abc', models: ['gpt-4o', 'gpt-4o-mini'] }),
    ).rejects.toThrow('Rate limit exceeded')
  })

  it('only calls checkRateLimit once regardless of how many models are compared', async () => {
    // compareModels uses Promise.allSettled — it resolves even if individual runs fail
    // internally (no DB mock). We only need to verify the entry-point rate check fires once.
    const { compareModels } = await import('@/lib/actions')
    await compareModels({ promptId: 'abc', models: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-6'] })
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1)
  })
})
