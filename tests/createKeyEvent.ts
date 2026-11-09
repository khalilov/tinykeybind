export const createKeyEvent = (type: string, code: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  return new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init })
}
