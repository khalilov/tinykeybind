// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createEngine } from '../src/createEngine'
import { type NormalizedMapping } from '../src/types'
import { createKeyEvent } from './createKeyEvent'

const mappingOf = (combos: string[][]): NormalizedMapping => new Map([['action', combos]])

describe('createEngine', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('activates a single key binding on keydown and clears it on keyup', () => {
    const engine = createEngine(mappingOf([['keya']]), {})

    expect(engine.is('action')).toBe(false)
    expect(engine.is('missing')).toBe(false)

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    expect(engine.is('action')).toBe(false)
  })

  it('requires every key of a chord', () => {
    const engine = createEngine(mappingOf([['control', 'keys']]), {})

    engine.onKeyDown(createKeyEvent('keydown', 'ControlLeft'))
    expect(engine.is('action')).toBe(false)

    engine.onKeyDown(createKeyEvent('keydown', 'KeyS'))
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'KeyS'))
    expect(engine.is('action')).toBe(false)

    engine.onKeyUp(createKeyEvent('keyup', 'ControlLeft'))
    expect(engine.is('action')).toBe(false)
  })

  it('ignores extra held keys outside the binding', () => {
    const engine = createEngine(mappingOf([['keya']]), {})

    engine.onKeyDown(createKeyEvent('keydown', 'ShiftLeft'))
    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'ShiftLeft'))
    expect(engine.is('action')).toBe(true)
  })

  it('keeps an alternative binding active while any alternative is held', () => {
    const engine = createEngine(mappingOf([['keya'], ['keyb']]), {})

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyDown(createKeyEvent('keydown', 'KeyB'))
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'KeyB'))
    expect(engine.is('action')).toBe(false)
  })

  it('reports only state transitions to the callback', () => {
    const callback = vi.fn()
    const engine = createEngine(mappingOf([['keya']]), { callback })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    expect(callback.mock.calls).toEqual([['action', true]])

    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    expect(callback.mock.calls).toEqual([
      ['action', true],
      ['action', false],
    ])
  })

  it('ignores repeated keydown events', () => {
    const engine = createEngine(mappingOf([['keya']]), {})

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA', { repeat: true }))
    expect(engine.is('action')).toBe(false)

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    expect(engine.is('action')).toBe(true)
  })

  it('prevents the default action of a matching keydown when asked', () => {
    const engine = createEngine(mappingOf([['keya']]), { prevent: true })
    const matching = createKeyEvent('keydown', 'KeyA')
    const releasing = createKeyEvent('keyup', 'KeyA')

    engine.onKeyDown(matching)
    expect(matching.defaultPrevented).toBe(true)

    engine.onKeyUp(releasing)
    expect(releasing.defaultPrevented).toBe(false)
  })

  it('does not prevent a keydown while nothing is active', () => {
    const engine = createEngine(mappingOf([['keya']]), { prevent: true })
    const event = createKeyEvent('keydown', 'KeyB')

    engine.onKeyDown(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('prevents any non-repeat keydown while an action is active', () => {
    const engine = createEngine(mappingOf([['keya']]), { prevent: true })
    const unrelated = createKeyEvent('keydown', 'KeyB')

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyDown(unrelated)

    expect(unrelated.defaultPrevented).toBe(true)
  })

  it('leaves the default action alone when prevent is off', () => {
    const engine = createEngine(mappingOf([['keya']]), {})
    const event = createKeyEvent('keydown', 'KeyA')

    engine.onKeyDown(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('keeps a released key active for the configured delay', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const engine = createEngine(mappingOf([['keya']]), { delay: 100, callback })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    expect(engine.is('action')).toBe(true)

    vi.advanceTimersByTime(99)
    expect(engine.is('action')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(engine.is('action')).toBe(false)
    expect(callback.mock.calls).toEqual([
      ['action', true],
      ['action', false],
    ])
  })

  it('cancels a pending release when the key is pressed again', () => {
    vi.useFakeTimers()
    const engine = createEngine(mappingOf([['keya']]), { delay: 100 })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    vi.advanceTimersByTime(50)

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    vi.advanceTimersByTime(100)
    expect(engine.is('action')).toBe(true)

    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    vi.advanceTimersByTime(100)
    expect(engine.is('action')).toBe(false)
  })

  it('clears all active keys and pending releases on blur', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const engine = createEngine(mappingOf([['keya'], ['keyb']]), { delay: 100, callback })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyDown(createKeyEvent('keydown', 'KeyB'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    engine.onBlur()

    expect(engine.is('action')).toBe(false)

    vi.advanceTimersByTime(100)
    expect(engine.is('action')).toBe(false)
    expect(callback.mock.calls).toEqual([
      ['action', true],
      ['action', false],
    ])
  })

  it('clears release timers on destroy', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const engine = createEngine(mappingOf([['keya']]), { delay: 100, callback })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))
    engine.destroy()

    vi.advanceTimersByTime(100)
    expect(callback.mock.calls).toEqual([['action', true]])
  })

  it('stays silent by default', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const engine = createEngine(mappingOf([['keya']]), {})

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))

    expect(log).not.toHaveBeenCalled()
  })

  it('logs raw key codes and matches when silence is off', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const engine = createEngine(mappingOf([['keya']]), { silence: false })

    engine.onKeyDown(createKeyEvent('keydown', 'KeyA'))
    engine.onKeyUp(createKeyEvent('keyup', 'KeyA'))

    const output = log.mock.calls.flat().join(' ')
    expect(output).toContain('keydown: KeyA')
    expect(output).toContain('keyup: KeyA')
    expect(output).toContain('Active keys')
    expect(output).toContain('Binding matched')
  })
})
