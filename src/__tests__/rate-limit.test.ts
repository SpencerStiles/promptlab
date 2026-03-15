import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

// Use unique IP prefixes per describe block to avoid cross-test state interference.
// The module uses a module-level Map that persists within a single test run.

import { checkRateLimit } from '../lib/rate-limit'

// Each test uses a distinct IP so the shared Map never sees two tests colliding.
let testId = 0
function freshIp(prefix = 'test'): string {
  return `${prefix}-${++testId}`
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first call for a new IP', () => {
    const ip = freshIp()
    const result = checkRateLimit(ip, 5)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.limit).toBe(5)
  })

  it('decrements remaining on successive calls', () => {
    const ip = freshIp()
    checkRateLimit(ip, 5) // 1st → remaining 4
    const second = checkRateLimit(ip, 5) // 2nd → remaining 3
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(3)
  })

  it('allows calls up to the limit with remaining reaching 0 on the last', () => {
    const ip = freshIp()
    const limit = 3
    let last: ReturnType<typeof checkRateLimit> | undefined
    for (let i = 0; i < limit; i++) {
      last = checkRateLimit(ip, limit)
      expect(last.allowed).toBe(true)
    }
    expect(last!.remaining).toBe(0)
  })

  it('blocks the call that exceeds the limit', () => {
    const ip = freshIp()
    const limit = 3
    for (let i = 0; i < limit; i++) {
      checkRateLimit(ip, limit)
    }
    // This is the (limit + 1)-th call — should be blocked
    const over = checkRateLimit(ip, limit)
    expect(over.allowed).toBe(false)
    expect(over.remaining).toBe(0)
  })

  it('uses the default limit of 20 when no limit argument is provided', () => {
    const ip = freshIp()
    const result = checkRateLimit(ip)
    expect(result.limit).toBe(20)
    expect(result.remaining).toBe(19)
  })

  it('maintains independent counters for different IPs', () => {
    const ip1 = freshIp('alpha')
    const ip2 = freshIp('beta')
    const limit = 2

    // Exhaust ip1
    checkRateLimit(ip1, limit)
    checkRateLimit(ip1, limit)
    const blocked = checkRateLimit(ip1, limit)
    expect(blocked.allowed).toBe(false)

    // ip2 should still be allowed
    const allowed = checkRateLimit(ip2, limit)
    expect(allowed.allowed).toBe(true)
    expect(allowed.remaining).toBe(1)
  })

  it('resets the window after 60 seconds have elapsed', () => {
    vi.useFakeTimers()
    const ip = freshIp('window')
    const limit = 2

    // Exhaust the limit
    checkRateLimit(ip, limit)
    checkRateLimit(ip, limit)
    expect(checkRateLimit(ip, limit).allowed).toBe(false)

    // Advance time past the 60-second window
    vi.advanceTimersByTime(60_001)

    // New window — should be allowed again
    const renewed = checkRateLimit(ip, limit)
    expect(renewed.allowed).toBe(true)
    expect(renewed.remaining).toBe(1)
  })
})
