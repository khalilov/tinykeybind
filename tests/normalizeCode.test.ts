import { describe, expect, it } from 'vitest'

import { normalizeCode } from '../src/utils/normalizeCode'

describe('normalizeCode', () => {
  it('lowercases physical key codes', () => {
    expect(normalizeCode('KeyA')).toBe('keya')
    expect(normalizeCode('Digit1')).toBe('digit1')
    expect(normalizeCode('F12')).toBe('f12')
    expect(normalizeCode('Space')).toBe('space')
    expect(normalizeCode('ArrowUp')).toBe('arrowup')
    expect(normalizeCode('Numpad1')).toBe('numpad1')
  })

  it('collapses left and right modifiers to one name', () => {
    expect(normalizeCode('ControlLeft')).toBe('control')
    expect(normalizeCode('ControlRight')).toBe('control')
    expect(normalizeCode('ShiftLeft')).toBe('shift')
    expect(normalizeCode('ShiftRight')).toBe('shift')
    expect(normalizeCode('AltLeft')).toBe('alt')
    expect(normalizeCode('AltRight')).toBe('alt')
    expect(normalizeCode('MetaLeft')).toBe('meta')
    expect(normalizeCode('MetaRight')).toBe('meta')
  })

  it('keeps other modifier-like codes untouched', () => {
    expect(normalizeCode('AltGraph')).toBe('altgraph')
    expect(normalizeCode('CapsLock')).toBe('capslock')
    expect(normalizeCode('OSLeft')).toBe('osleft')
  })
})
