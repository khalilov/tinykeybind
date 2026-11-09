# SPEC — tinykeybind

## Purpose

`tinykeybind` turns a declarative keyboard mapping into an action-state store.
It listens to `keydown`, `keyup`, and `blur` on `window`, matches physical
`KeyboardEvent.code` values, and exposes `is(action)` plus `dispose()`.

The library owns four things:

- the normalized mapping from action names to key combinations;
- the set of keys considered active, including delayed releases;
- the boolean state of every action and its transition callbacks;
- the `window` subscriptions and release timers that keep that state alive.

## Public API

```ts
type Binding = string | string[] | ['and', string[]]

type Mapping = Record<string, Binding>

interface Options {
  silence?: boolean
  prevent?: boolean
  delay?: number
  callback?: (action: string, state: boolean) => void
}

type NormalizedMapping = Map<string, string[][]>

declare const tinykeybind: (
  mapping: Mapping,
  options?: Options
) => {
  is: (action: string) => boolean
  dispose: () => void
}
```

`normalizeCode`, `normalizeMapping`, and `createEngine` are internal. Only
`tinykeybind` and the types above are exported from the package entry point.

## Mapping normalization

Object entries are processed in insertion order. Action names are preserved
exactly; only key names are lowercased.

| `Binding`                      | Normalized combination list | Meaning                  |
| ------------------------------ | --------------------------- | ------------------------ |
| `'KeyS'`                       | `[['keys']]`                | one key                  |
| `['KeyA', 'KeyB']`             | `[['keya'], ['keyb']]`      | alternatives, either key |
| `['and', ['Control', 'KeyS']]` | `[['control', 'keys']]`     | chord, every key at once |
| `[]`                           | `[]`                        | never matches            |
| `['and', []]`                  | `[[]]`                      | always matches           |

Rules:

- The `'and'` marker is recognized only as the exact lowercase string in
  position 0 with an array in position 1. TypeScript enforces this shape.
- A non-matching array shape falls back to the alternatives branch. Runtime
  JavaScript callers that pass malformed arrays get one single-key combination
  per element rather than an error.
- A binding that is neither a string nor an array produces an empty combination
  list. TypeScript prevents this; untyped callers see an action that never
  matches.
- Empty alternatives produce `[]`, so the action never becomes active.
- An empty chord produces `[[]]`. Every key test over an empty combination is
  vacuously true, so the action becomes active on the first evaluation and
  stays active for the lifetime of the engine. This is a degenerate shape, not
  a supported shortcut.
- Key names are lowercased with `String.prototype.toLowerCase`. No other
  transformation happens during mapping normalization.

## Key normalization

`KeyboardEvent.code` is normalized on every key event:

1. Convert the code to lowercase.
2. Collapse the left and right variants of the four standard modifiers.
3. Return the result unchanged otherwise.

| Event code                    | Normalized |
| ----------------------------- | ---------- |
| `ControlLeft`, `ControlRight` | `control`  |
| `ShiftLeft`, `ShiftRight`     | `shift`    |
| `AltLeft`, `AltRight`         | `alt`      |
| `MetaLeft`, `MetaRight`       | `meta`     |
| `KeyA`                        | `keya`     |
| `Digit1`                      | `digit1`   |
| `F12`                         | `f12`      |
| `ArrowUp`                     | `arrowup`  |
| `AltGraph`                    | `altgraph` |
| `OSLeft`                      | `osleft`   |

Only the listed modifier pairs collapse. `AltGraph`, `CapsLock`, `OSLeft`, and
similar codes keep their own names.

Key normalization applies to event codes, not to mapping keys. Consequently a
mapping must already use canonical modifier names:

```ts
tinykeybind({ save: ['and', ['control', 'keys']] }) // matches Ctrl+S
tinykeybind({ save: ['and', ['controlleft', 'keys']] }) // never matches
```

## Matching semantics

An action is active when at least one of its combinations is fully contained in
the active-key set.

- A combination matches when every key in it is active.
- Additional active keys do not prevent a match.
- Alternatives are independent: holding any one matching alternative keeps the
  action active.
- Chords require all their keys at the same time. They are not sequences.
- Matching is global to the engine. Every action is evaluated after every state
  change.
- An action starts as inactive and has no state entry before the first
  evaluation.
- `is(action)` returns `false` for unknown actions and for known actions that
  have not become active.
- State changes are reported through `callback(action, state)` exactly once per
  transition, including deactivation.
- `callback` is not called at construction, and not called when an evaluation
  leaves the state unchanged.

## Options

### `silence`

Default: `true`.

When `false`, the engine logs:

- the raw `event.code` on `keydown` and `keyup`;
- the active-key set after every evaluation;
- whether a match was prevented or allowed.

A repeated `keydown` is still logged, then ignored before evaluation.

### `prevent`

Default: `false`.

When `true`, `preventDefault()` is called on a `keydown` event if any action is
active after evaluating that event. This has three consequences:

- A keydown that completes a chord is prevented.
- A non-repeat keydown unrelated to any binding is also prevented while some
  action is already active.
- Repeated keydown events are ignored before evaluation and are never
  prevented.

`keyup`, delayed-release evaluations, and `blur` never call `preventDefault`.

### `delay`

Default: `0`.

When `delay` is greater than zero, a released key stays in the active set until
its release timer fires. During that window it can complete or keep alive a
chord.

- A `keydown` for a code with a pending release timer clears that timer and
  keeps the key active.
- The timer removes the key and runs an evaluation without a DOM event, so it
  cannot prevent a default action.
- `blur` and `destroy` clear all timers.
- A keyup without a matching keydown still schedules a release timer. Two
  keyups for the same code before a keydown schedule two timers and do not
  cancel each other; the first one clears the action.

### `callback`

Default: `undefined`.

Receives `(action, state)` after the state map changes and before `prevent` is
applied. A callback that throws aborts the rest of that evaluation.

## Event lifecycle

### `keydown`

1. If `silence` is `false`, log the raw `event.code`.
2. If `event.repeat` is `true`, stop.
3. Normalize `event.code`.
4. Add the normalized key to the pressed set and the active set.
5. Clear any pending release timer for that key.
6. Evaluate all actions and optionally prevent the event.

The pressed set exists for lifecycle cleanup. Matching uses the active set.

### `keyup`

1. If `silence` is `false`, log the raw `event.code`.
2. Normalize `event.code`.
3. Remove the key from the pressed set.
4. If `delay > 0`, schedule a release timer; otherwise remove the key from the
   active set immediately.
5. Evaluate all actions unless a release timer was scheduled.

### `blur`

1. Clear every release timer.
2. Clear pressed keys, active keys, and timer entries.
3. Evaluate all actions without a DOM event.

Every action that was active transitions to inactive and reports
`callback(action, false)`.

### `destroy`

An internal cleanup step. Clears every pending release timer and the timer map.
It does not clear the active set, the action state, or the pressed set.

### `dispose`

The public cleanup step:

1. Removes the `window` subscriptions for `keydown`, `keyup`, and `blur`.
2. Calls `destroy()`.

`dispose` is safe to call more than once. Because `destroy` does not reset
state, `is(action)` can keep returning the last value after `dispose`. Stop
using the handle after disposal.

## Browser integration

- `tinykeybind` calls `window.addEventListener` immediately. It is browser-only
  and fails during server-side rendering without a `window`.
- Listeners are registered without `capture`, `passive`, or `once` options.
- Each instance owns independent state and timers. Instances do not coordinate,
  and every instance applies its own `prevent` setting to the same events.
- `KeyboardEvent.code` is a physical-key identifier. Bindings stay stable when
  the keyboard layout changes.
- The library does not call `preventDefault` on `keydown` when `prevent` is
  `false`, even if a binding matches.

## Edge cases

- Repeated keydown events never change state and never prevent.
- Extra modifiers do not block single-key or chord bindings.
- A mapping key written as `ControlLeft` never matches, because mapping keys are
  not passed through key normalization.
- An empty alternative list never activates its action.
- An empty chord activates its action on the first evaluation.
- Holding two alternatives keeps the action active until both are released.
- Releasing one key of a chord deactivates the action, subject to `delay`.
- Re-pressing during the release delay cancels the pending deactivation.
- `blur` deactivates all actions and cancels delayed releases.
- `dispose` keeps the last action state.
- Unknown actions always report `false` through `is`.
- The same action can appear only once in an object mapping.
- There is no sequence support: `['and', ['control', 'keys']]` means Ctrl+S at
  the same time, not Ctrl then S.

## Out of scope

- Key sequences and multi-step shortcuts.
- Scoping listeners to an element, shadow root, or iframe.
- Capture phase, passive listeners, or custom event listener options.
- Per-binding `prevent` or per-binding delay.
- Dynamic mapping updates after the factory call.
- Layout-dependent `KeyboardEvent.key` names.
- IME, composition events, virtual keyboards, and touch input.
- Server-side rendering.
- Automatic cleanup integration with a view framework.
