import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('DATABASE_URL', 'postgresql://test@localhost:5432/test')
vi.stubEnv('NODE_ENV', 'test')

import { extractVariables, resolveTemplate, validateVariables } from '../lib/variables'

describe('extractVariables', () => {
  it('extracts two variables from a template', () => {
    const result = extractVariables('Translate the following {{language}}: {{text}}')
    expect(result).toEqual(['language', 'text'])
  })

  it('returns empty array when template has no variables', () => {
    const result = extractVariables('Hello, world!')
    expect(result).toEqual([])
  })

  it('deduplicates repeated variables', () => {
    const result = extractVariables('{{name}} said hello to {{name}} and {{name}}')
    expect(result).toEqual(['name'])
  })

  it('deduplicates multiple distinct variables that repeat', () => {
    const result = extractVariables('{{a}} {{b}} {{a}} {{b}}')
    expect(result).toEqual(['a', 'b'])
  })

  it('ignores nested or malformed braces', () => {
    const result = extractVariables('{{{nested}}} and {{valid}}')
    // {{{nested}}} matches {{nested}} inside, so 'nested' is extracted
    // {{valid}} → 'valid' is also extracted
    expect(result).toContain('valid')
  })

  it('returns empty array for empty template', () => {
    expect(extractVariables('')).toEqual([])
  })
})

describe('resolveTemplate', () => {
  it('replaces all variables when all are provided', () => {
    const result = resolveTemplate('Hello {{name}}, you are {{age}} years old.', {
      name: 'Alice',
      age: '30',
    })
    expect(result).toBe('Hello Alice, you are 30 years old.')
  })

  it('leaves {{var}} in place when a variable is missing', () => {
    const result = resolveTemplate('Hello {{name}}, you are {{age}} years old.', {
      name: 'Alice',
    })
    expect(result).toBe('Hello Alice, you are {{age}} years old.')
  })

  it('returns empty string for empty template', () => {
    expect(resolveTemplate('', {})).toBe('')
  })

  it('returns template unchanged when no variables exist and none provided', () => {
    const result = resolveTemplate('No variables here.', {})
    expect(result).toBe('No variables here.')
  })

  it('handles multiple occurrences of the same variable', () => {
    const result = resolveTemplate('{{x}} and {{x}}', { x: 'foo' })
    expect(result).toBe('foo and foo')
  })
})

describe('validateVariables', () => {
  it('returns valid when all template variables are provided', () => {
    const result = validateVariables('{{a}} and {{b}}', { a: 'hello', b: 'world' })
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('returns invalid and lists the missing variable name', () => {
    const result = validateVariables('{{a}} and {{b}}', { a: 'hello' })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('b')
    expect(result.missing).not.toContain('a')
  })

  it('treats extra variables as valid (no error)', () => {
    const result = validateVariables('{{a}}', { a: 'hello', extra: 'ignored' })
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('returns valid for template with no variables', () => {
    const result = validateVariables('no vars here', {})
    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('treats whitespace-only values as missing', () => {
    const result = validateVariables('{{name}}', { name: '   ' })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('name')
  })
})
