# tinykeybind

Tiny keyboard binding library with chords and hold detection for browser apps.
Zero runtime dependencies. Bind physical `KeyboardEvent.code` values, mix
alternatives and chords, keep a released key active for a short delay, and read
the action state at any time.

> 🤖 Coding agent? Load the [tinykeybind skill](https://github.com/khalilov/tinykeybind/blob/main/skills/tinykeybind/SKILL.md).
> Need every edge case? Open the [full specification](https://github.com/khalilov/tinykeybind/blob/main/SPEC.md).

## Install

```sh
npm install tinykeybind
```

## Quick start

```ts
import { tinykeybind } from 'tinykeybind'

const keys = tinykeybind(
  {
    save: ['and', ['control', 'keys']],
    close: 'escape',
    palette: ['and', ['meta', 'keyk']],
    arrows: ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'],
  },
  {
    delay: 120,
    prevent: true,
    callback: (action, active) => {
      console.log(action, active ? 'on' : 'off')
    },
  }
)

keys.is('save')
keys.dispose()
```

The factory listens on `window` for `keydown`, `keyup`, and `blur`. The returned
object exposes `is(action)` and `dispose()`.

## Mapping

A mapping is a plain object: action name to binding. Three binding forms exist:

```ts
const keys = tinykeybind({
  close: 'Escape', // one key
  arrows: ['ArrowUp', 'ArrowDown'], // alternatives: either key
  save: ['and', ['Control', 'KeyS']], // chord: every key at once
})
```

- A string matches one key.
- A string array matches any one of its keys.
- `['and', keys]` matches only while every key in the list is active.
- Key names follow `KeyboardEvent.code`, lowercased: `KeyA`, `Digit1`, `F1`,
  `Space`, `ArrowUp`, `Numpad1`.
- Use canonical modifier names: `control`, `shift`, `alt`, `meta`. The engine
  collapses `ControlLeft`/`ControlRight` and the other left/right pairs to those
  names. Write the canonical name in the mapping too; `ControlLeft` in a mapping
  is lowercased to `controlleft` and never matches.
- Extra held keys do not break a binding. `Shift` plus `KeyA` still activates a
  binding that only needs `KeyA`.
- Bindings are simultaneous chords, not sequences.

## Options

| Option     | Default     | Meaning                                                                  |
| ---------- | ----------- | ------------------------------------------------------------------------ |
| `silence`  | `true`      | When `false`, logs raw key codes and active keys to the console.         |
| `prevent`  | `false`     | Calls `preventDefault()` on non-repeat `keydown` while any action is on. |
| `delay`    | `0`         | Milliseconds a released key stays active.                                |
| `callback` | `undefined` | Called as `(action, active)` whenever an action changes state.           |

`prevent` works on `keydown` only. While any action is active, every non-repeat
`keydown` is prevented, including an unrelated key. Repeated `keydown` events are
ignored and never prevented. `keyup`, release timers, and `blur` never prevent.

## API

### `is(action)`

Returns the current boolean state of an action. An unknown action is `false`.
The value changes on key events; it is not a subscription.

```ts
if (keys.is('save')) {
  saveDocument()
}
```

### `dispose()`

Removes the `window` listeners and clears pending release timers. Call it when
the owning view is destroyed. It does not reset the last reported action state,
so `is()` may keep returning `true` after `dispose()` until you stop reading it.

```ts
const keys = tinykeybind({ close: 'Escape' })

// later
keys.dispose()
```

Multiple `tinykeybind()` instances are independent. Each one owns its listeners,
state, and timers.

## Hold delay

`delay` keeps a key active after `keyup`, which makes quick taps and slightly
sloppy chords feel reliable:

```ts
const keys = tinykeybind({ save: ['and', ['control', 'keys']] }, { delay: 150 })
```

Pressing `Control`, tapping `S`, and releasing `Control` within 150 ms still
activates `save`. Pressing the key again before the timer fires cancels the
pending release. `blur` clears every active key and cancels every timer
immediately.

## Browser behavior

- `keydown` with `event.repeat === true` is ignored.
- `keyup` starts the release delay, or deactivates the key immediately when
  `delay` is `0`.
- `blur` clears all active keys, all pressed keys, and all release timers.
- The library requires `window`; it cannot be created during server-side
  rendering.

`tinykeybind` reads `event.code`, so bindings follow physical key positions and
stay stable across keyboard layouts.

## Development

```sh
npm test
npm run typecheck
npm run build
npm run check
npm run pack:check
```

## Agent skill

The package ships a `SKILL.md` skill in `skills/tinykeybind/`. Point your agent
at it — symlink the **folder**, not the `SKILL.md` file.

| Tool        | Location                                                      | Install |
| ----------- | ------------------------------------------------------------- | ------- |
| opencode    | `opencode.json` → `skills.paths`                              | config  |
| Claude Code | `~/.claude/skills/` (personal) or `.claude/skills/` (project) | symlink |
| Codex       | `~/.agents/skills/` (user) or `.agents/skills/` (repo)        | symlink |

opencode — add the packaged path to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "skills": { "paths": ["node_modules/tinykeybind/skills"] }
}
```

Claude Code and Codex — symlink the folder (`.agents/skills` also serves other
Agent Skills clients):

```sh
ln -sfn "$PWD/node_modules/tinykeybind/skills/tinykeybind" ~/.agents/skills/tinykeybind
ln -sfn "$PWD/node_modules/tinykeybind/skills/tinykeybind" ~/.claude/skills/tinykeybind
```

Restart opencode and Codex after installing; Claude Code picks up new skills
after a restart too, then watches them live. Re-run the symlink if you reinstall
the package.

In this repository the skill lives at `skills/tinykeybind/SKILL.md` and needs no
installation.
