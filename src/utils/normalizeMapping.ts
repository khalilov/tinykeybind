import { type Mapping, type NormalizedMapping } from '../types'

export const normalizeMapping = (mapping: Mapping): NormalizedMapping => {
  const result: NormalizedMapping = new Map()

  for (const [action, binding] of Object.entries(mapping)) {
    let combos: string[][] = []

    if (typeof binding === 'string') {
      combos = [[binding.toLowerCase()]]
    } else if (Array.isArray(binding)) {
      if (binding[0] === 'and' && Array.isArray(binding[1])) {
        combos = [(binding[1] as string[]).map((k) => k.toLowerCase())]
      } else {
        combos = binding.map((k) => [(k as string).toLowerCase()])
      }
    }

    result.set(action, combos)
  }

  return result
}
