export type Binding = string | string[] | ['and', string[]]

export type Mapping = Record<string, Binding>

export interface Options {
  silence?: boolean // if false, logs all keystrokes and active keys to the console
  prevent?: boolean // if true, it blocks the browser's default behavior (e.preventDefault)
  delay?: number // time, in ms, during which a released key remains "active"
  callback?: (action: string, state: boolean) => void //callback for action state changes
}

export type NormalizedMapping = Map<string, string[][]> // normalized mapping: action -> array of combinations
