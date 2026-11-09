# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-09

### Added

- `tinykeybind(mapping, options?)` factory that listens for `keydown`, `keyup`,
  and `blur` on `window`.
- Single-key bindings, alternative key lists, and `['and', keys]` chords.
- Physical `KeyboardEvent.code` matching with case-insensitive key names.
- Automatic collapsing of left/right `Control`, `Shift`, `Alt`, and `Meta`
  events to `control`, `shift`, `alt`, and `meta`.
- `delay` option that keeps a released key active for a configurable time.
- `prevent` option for blocking browser default actions.
- `silence` option for logging raw key codes and active keys.
- `callback(action, active)` for action state transitions.
- `is(action)` state lookup and `dispose()` cleanup.
- TypeScript types for bindings, mappings, options, and normalized mappings.
- Vitest test suite covering normalization, matching, chords, delay, blur,
  prevention, callbacks, logging, and disposal.
- Agent skill at `skills/tinykeybind/SKILL.md`.
- Full API and edge-case documentation in `README.md` and `SPEC.md`.

[0.1.0]: https://github.com/khalilov/tinykeybind/releases/tag/v0.1.0
