/**
 * Standardizes key names.
 * MetaLeft/MetaRight -> meta
 */
export const normalizeCode = (code: string): string => {
  const c = code.toLowerCase()

  if (c === 'metaleft' || c === 'metaright') return 'meta'
  if (c === 'controlleft' || c === 'controlright') return 'control'
  if (c === 'shiftleft' || c === 'shiftright') return 'shift'
  if (c === 'altleft' || c === 'altright') return 'alt'

  return c
}
