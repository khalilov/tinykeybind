import { normalizeMapping } from './utils/normalizeMapping'
import { createEngine } from './createEngine'
import { type Mapping, type Options } from './types'

export const tinykeybind = (mapping: Mapping, options: Options = {}) => {
  const normalized = normalizeMapping(mapping)
  const engine = createEngine(normalized, options)

  window.addEventListener('keydown', engine.onKeyDown)
  window.addEventListener('keyup', engine.onKeyUp)
  window.addEventListener('blur', engine.onBlur)

  return {
    is: engine.is, // check whether the action is currently active

    // unsubscribe from events and clear timers
    dispose: () => {
      window.removeEventListener('keydown', engine.onKeyDown)
      window.removeEventListener('keyup', engine.onKeyUp)
      window.removeEventListener('blur', engine.onBlur)

      engine.destroy()
    },
  }
}
