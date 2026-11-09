import { type Options, type NormalizedMapping } from './types'
import { normalizeCode } from './utils/normalizeCode.ts'

export const createEngine = (mapping: NormalizedMapping, options: Options) => {
  const { silence = true, prevent = false, delay = 0, callback } = options

  const down = new Set<string>()
  const active = new Set<string>()
  const state = new Map<string, boolean>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const evaluate = (event?: KeyboardEvent) => {
    let matched = false

    for (const [action, combos] of mapping) {
      const now = combos.some((combo) => combo.every((key) => active.has(key)))
      const was = state.get(action) || false

      if (now !== was) {
        state.set(action, now)
        callback?.(action, now)
      }

      if (now) matched = true
    }

    if (matched && prevent && event) {
      event.preventDefault()
    }

    if (!silence) {
      console.log(`[tinykeybind] Active keys:`, Array.from(active))

      if (matched) {
        console.log(`[tinykeybind] Binding matched and ${prevent ? 'prevented' : 'allowed'}`)
      }
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!silence) {
      console.log(`[tinykeybind] keydown: ${event.code}`)
    }

    if (!event.repeat) {
      const code = normalizeCode(event.code)

      down.add(code)
      active.add(code)

      if (timers.has(code)) {
        clearTimeout(timers.get(code)!)

        timers.delete(code)
      }

      evaluate(event)
    }
  }

  const onKeyUp = (event: KeyboardEvent) => {
    if (!silence) {
      console.log(`[tinykeybind] keyup: ${event.code}`)
    }

    const code = normalizeCode(event.code)

    down.delete(code)

    if (delay > 0) {
      const timer = setTimeout(() => {
        active.delete(code)
        timers.delete(code)
        evaluate()
      }, delay)

      timers.set(code, timer)
    } else {
      active.delete(code)

      evaluate()
    }
  }

  const onBlur = () => {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }

    down.clear()
    active.clear()
    timers.clear()

    evaluate()
  }

  const destroy = () => {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }

    timers.clear()
  }

  return {
    onKeyDown,
    onKeyUp,
    onBlur,
    destroy,
    is: (action: string) => state.get(action) || false,
  }
}
