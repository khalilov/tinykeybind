---
name: tinykeybind
description: Use when writing or editing browser TypeScript that imports `tinykeybind`, defines keyboard mappings with chords or alternatives, uses hold/release delay, preventDefault, or action state.
---

# tinykeybind

Small keyboard-binding engine over physical `KeyboardEvent.code` values. It
listens on `window`, matches simultaneous chords, and exposes action state.

Named import only:

```ts
import { tinykeybind } from 'tinykeybind'
```

## Create

```ts
const keys = tinykeybind(
  {
    save: ['and', ['control', 'keys']],
    close: 'escape',
    arrows: ['arrowup', 'arrowdown'],
  },
  {
    delay: 120,
    prevent: true,
    callback: (action, active) => console.log(action, active),
  }
)
```

Three binding forms:

- `'KeyS'` — one key.
- `['KeyA', 'KeyB']` — alternatives; either key activates the action.
- `['and', ['Control', 'KeyS']]` — chord; every key must be active at once.

Key names follow `KeyboardEvent.code`, lowercased: `keya`, `digit1`, `space`,
`arrowup`, `f1`, `numpad1`.

## Canonical modifiers

Use `control`, `shift`, `alt`, `meta`. The engine collapses `ControlLeft` and
`ControlRight` to `control` (and the other left/right pairs) on events, but
**mapping keys are only lowercased**. `['and', ['ControlLeft', 'KeyS']]` becomes
`controlleft` and never matches. Write the canonical name in the mapping.

## Options

| Option     | Default | Effect                                                      |
| ---------- | ------- | ----------------------------------------------------------- |
| `silence`  | `true`  | `false` logs raw key codes, active keys, and match results. |
| `prevent`  | `false` | Prevents non-repeat `keydown` while any action is active.   |
| `delay`    | `0`     | Keeps a released key active for this many milliseconds.     |
| `callback` | none    | Called as `(action, active)` on every state transition.     |

`prevent` is global to the engine: while any action is active, an unrelated
non-repeat `keydown` is also prevented. Repeated `keydown` events are ignored
and never prevented.

## State and cleanup

```ts
keys.is('save') // current boolean state; unknown action is false
keys.dispose() // remove window listeners and clear release timers
```

`is()` is a snapshot, not a subscription. Use `callback` for transitions.
`dispose()` does not reset the last state; stop reading the handle after cleanup.

## Lifecycle rules

- `keydown` with `event.repeat === true` is ignored.
- `keyup` deactivates immediately, or after `delay` milliseconds.
- Re-pressing before the release timer fires cancels the pending deactivation.
- `blur` clears all active keys, pressed keys, and timers.
- Extra held keys do not block a binding: Shift+KeyA activates a `keya` binding.
- Chords are simultaneous. This library has no key sequences.
- The factory needs `window`; do not call it during server-side rendering.
- Multiple instances are independent.

## Typical use

```ts
const keys = tinykeybind({
  palette: ['and', ['meta', 'keyk']],
  help: 'f1',
  save: ['and', ['control', 'keys']],
})

const stop = () => keys.dispose()
window.addEventListener('beforeunload', stop, { once: true })
```

Do not reimplement modifier collapsing in user code, add layout-dependent
`event.key` matching, or wrap `tinykeybind` in a framework singleton when one
call at the owning view is enough.

Full API, normalization tables, and edge cases: `SPEC.md`.
