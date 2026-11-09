// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { tinykeybind } from '../src/tinykeybind'
import { createKeyEvent } from './createKeyEvent'

describe('tinykeybind', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('listens on window and reports the action state', () => {
    const keys = tinykeybind({ fire: 'KeyA' })

    expect(keys.is('fire')).toBe(false)

    window.dispatchEvent(createKeyEvent('keydown', 'KeyA'))
    expect(keys.is('fire')).toBe(true)

    window.dispatchEvent(createKeyEvent('keyup', 'KeyA'))
    expect(keys.is('fire')).toBe(false)

    keys.dispose()
  })

  it('supports chords through the public API', () => {
    const keys = tinykeybind({ save: ['and', ['Control', 'KeyS']] })

    window.dispatchEvent(createKeyEvent('keydown', 'ControlLeft'))
    window.dispatchEvent(createKeyEvent('keydown', 'KeyS'))
    expect(keys.is('save')).toBe(true)

    keys.dispose()
  })

  it('stops listening after dispose', () => {
    const keys = tinykeybind({ fire: 'KeyA' })

    keys.dispose()
    window.dispatchEvent(createKeyEvent('keydown', 'KeyA'))

    expect(keys.is('fire')).toBe(false)
  })

  it('clears pending release timers on dispose', () => {
    vi.useFakeTimers()
    const callback = vi.fn()
    const keys = tinykeybind({ fire: 'KeyA' }, { delay: 100, callback })

    window.dispatchEvent(createKeyEvent('keydown', 'KeyA'))
    window.dispatchEvent(createKeyEvent('keyup', 'KeyA'))
    keys.dispose()

    vi.advanceTimersByTime(100)
    expect(callback.mock.calls).toEqual([['fire', true]])
  })

  it('keeps instances independent', () => {
    const first = tinykeybind({ first: 'KeyA' })
    const second = tinykeybind({ second: 'KeyB' })

    window.dispatchEvent(createKeyEvent('keydown', 'KeyA'))
    expect(first.is('first')).toBe(true)
    expect(second.is('second')).toBe(false)

    first.dispose()
    second.dispose()
  })

  it('passes prevent through to keydown events', () => {
    const keys = tinykeybind({ fire: 'KeyA' }, { prevent: true })
    const event = createKeyEvent('keydown', 'KeyA')

    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)

    keys.dispose()
  })
})
