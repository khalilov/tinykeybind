import { describe, expect, it } from 'vitest'

import { normalizeMapping } from '../src/utils/normalizeMapping'

describe('normalizeMapping', () => {
  it('turns a string binding into one single-key combination', () => {
    const normalized = normalizeMapping({ save: 'KeyS' })

    expect(normalized.get('save')).toEqual([['keys']])
  })

  it('turns an array binding into alternative single-key combinations', () => {
    const normalized = normalizeMapping({ move: ['ArrowUp', 'ArrowDown'] })

    expect(normalized.get('move')).toEqual([['arrowup'], ['arrowdown']])
  })

  it('turns an "and" binding into one chord combination', () => {
    const normalized = normalizeMapping({ save: ['and', ['Control', 'KeyS']] })

    expect(normalized.get('save')).toEqual([['control', 'keys']])
  })

  it('preserves action names and lowercases every key', () => {
    const normalized = normalizeMapping({
      'editor.save': 'KeyS',
      'editor.close': ['and', ['Meta', 'KeyW']],
    })

    expect(Array.from(normalized.keys())).toEqual(['editor.save', 'editor.close'])
    expect(normalized.get('editor.close')).toEqual([['meta', 'keyw']])
  })

  it('does not collapse left or right modifier names', () => {
    const normalized = normalizeMapping({ save: ['and', ['ControlLeft', 'KeyS']] })

    expect(normalized.get('save')).toEqual([['controlleft', 'keys']])
  })

  it('keeps an empty alternative list empty', () => {
    const normalized = normalizeMapping({ never: [] })

    expect(normalized.get('never')).toEqual([])
  })

  it('keeps an empty chord as one empty combination', () => {
    const normalized = normalizeMapping({ always: ['and', []] })

    expect(normalized.get('always')).toEqual([[]])
  })
})
