import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

// Mock Prisma and NextAuth dependencies so auth.ts can be imported without a real DB
vi.mock('@/lib/db', () => ({
  prisma: {},
}))

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

vi.mock('next-auth/providers/github', () => ({
  default: vi.fn(() => ({ id: 'github', type: 'oauth' })),
}))

import type { Session } from 'next-auth'
import { getUserScope } from '../lib/auth'

// Helper to build a minimal Session shape
function makeSession(userId?: string): Session {
  return {
    user: userId ? { id: userId, name: 'Test User', email: 'test@example.com' } : { name: 'Test', email: 'test@example.com' },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  } as Session
}

describe('getUserScope', () => {
  it('returns { userId } when session has a user with an id', () => {
    const session = makeSession('user-123')
    expect(getUserScope(session)).toEqual({ userId: 'user-123' })
  })

  it('returns {} when session user has no id field', () => {
    const session = makeSession() // no id
    expect(getUserScope(session)).toEqual({})
  })

  it('returns {} for a null session', () => {
    expect(getUserScope(null)).toEqual({})
  })

  it('returns {} when session.user is undefined', () => {
    const session = { expires: new Date().toISOString() } as Session
    expect(getUserScope(session)).toEqual({})
  })
})
