# opencode-zed-status

[English](README.md) | [简体中文](README.zh-CN.md)

OpenCode **V2** CLI plugin that gives Zed's terminal status feedback (zero-dependency, zero-build):

- **Title** (OSC 0): static `▣` glyph when idle, quadrant spinner frames (`▘▝▗▖`, 200 ms/frame) while busy. Zed's Threads sidebar shows the `▣` mark in the icon slot, spinning in sync.
- **Bell**: writes BEL (`\x07`) when a top-level task finishes or permission/form input is needed; Zed shows a notification + blue dot when the terminal is unfocused.

> Requires OpenCode **v2** (the V2 CLI plugin API). For OpenCode v1, use `opencode-zed-status@1.1.3` — the V1 plugin API is not supported by v2.

## Install

### Option 1: npm (recommended)

```sh
opencode plugin add opencode-zed-status
```

or add the package to `plugins` in `~/.config/opencode/cli.json`:

```json
{
  "plugins": ["opencode-zed-status"],
  "terminal": { "title": false }
}
```

- `terminal.title: false` (or run **Disable terminal title** once from the command palette) turns off OpenCode's built-in title writer so this plugin is the **single title owner**. Without it, both write and the glyph may flicker for up to a second after built-in updates (the plugin self-heals, but why fight).
- Restart opencode after installing. Saving `cli.json` hot-reloads while the TUI is running.

### Option 2: local directory

Clone or download this repository, then point `cli.json` at the directory (it works as-is; the loader resolves the physical `tui.js`):

```json
{
  "plugins": ["file:///D:/Artifact/OC-Zed-Status"]
}
```

## Behavior

- Idle title: `▣ <session title>`; default/untitled sessions show `▣ OpenCode`
- Busy: `▘ ▝ ▗ ▖` spinner on the left, 200 ms per frame — starts and stops **instantly** (status transitions are event-driven)
- Auto-recovery: the title is re-asserted at least once a second, so anything that overwrites it (copying text, other tools, a forgotten built-in writer) is repaired within ≤1 s — the 200 ms poll only remains as the floor for route changes, frame animation, and this self-heal
- Bell: rings for **top-level** session completion (`succeeded`/`interrupted`/`failed`) and for `permission` / form prompts at any level; **sub-agent completion stays silent**
- Title truncated to 40 characters (ellipsis `…`); the `▣` glyph itself identifies the OpenCode thread in Zed's sidebar

### Relationship with OpenCode's built-in attention

OpenCode v2 ships system notifications and sounds natively (the `attention` settings in `cli.json`, plus the built-in `opencode.notifications` plugin). This plugin does **not** duplicate them — it only adds the BEL channel, which is what makes Zed's blue dot work. Keep `attention.notifications` / `attention.sound` enabled if you want those too.

## Disable or uninstall

One and the same action: remove the entry from `plugins` in `cli.json` (or `opencode plugin remove opencode-zed-status` for npm installs). Re-enable `terminal.title` if you want the built-in title back. There is no separate toggle.

## Files

| File | Purpose |
|---|---|
| `tui.js` | Plugin entry (`{ id, setup }`, the V2 `./tui` contract); composes the two modules |
| `title.js` | Terminal title: dual-scheduler — events trigger instant recompute on status transitions; the poll is the floor (route changes, frames, self-heal) |
| `bell.js` | BEL bell; event set mirrors the built-in `opencode.notifications` (dedup included) |

## Development

`npm test` runs the zero-dependency mock-contract suite (`test.mjs`): it simulates the OpenCode V2 plugin host and asserts the full behavior matrix, including the event names and payload shapes verified against the v2.0.21 host source — making it the drift alarm against future OpenCode releases. Requires Node 18+, no install step.
