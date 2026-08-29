# opencode-zed-status

[English](README.md) | [简体中文](README.zh-CN.md)

OpenCode TUI plugins that give Zed terminal status feedback (zero-dependency, single files):

| File | Export | Purpose |
|---|---|---|
| `zed-bell.js` | `bellTui` | Writes BEL (`\x07`) to the terminal when a task finishes or permission is requested; Zed shows a notification + blue dot when unfocused |
| `zed-title.js` | `titleTui` | Owns the terminal title (OSC 0): static `▣` icon when idle, quadrant spinner frames while busy / retrying |

The two don't conflict (BEL vs OSC 0) and can be used together.

## Install

### Option 1: npm (recommended)

```sh
opencode plugin add opencode-zed-status
```

Or add the package name to the `plugin` array in `~/.config/opencode/tui.json` and restart:

```json
{
  "plugin": ["opencode-zed-status"]
}
```

> Note: TUI plugins are configured in `tui.json`, not `opencode.json`. On some versions `opencode plugin add` is buggy (only prints help); edit `tui.json` directly in that case.

### Option 2: Local files

Download `zed-bell.js` / `zed-title.js` to any directory, then declare them by path in `tui.json` (TUI plugins have **no** directory auto-discovery):

```json
{
  "plugin": ["/path/to/zed-bell.js", "/path/to/zed-title.js"]
}
```

**Restart opencode after either option.**

## Usage

Just use opencode normally in a Zed Terminal Thread — no extra configuration:

- Static icon: when idle the title is `▣ OC | <title>`; Zed's Threads Sidebar shows `▣` in the icon slot (mirrors the opencode official mark)
- Busy animation: while busy / retrying, the quadrant blocks rotate (`▘ ▝ ▗ ▖`, 200ms/frame) on the left; the sidebar icon spins in sync
- Auto-recovery: the title is written by a polling loop; if anything else overwrites it (session switch, `/new`, copying text, etc.), the `▣` prefix is restored within ≤1s
- Bell: rings on task completion or permission requests; Zed notifies when unfocused
- Title truncated to 40 chars, keeps the `OC |` prefix
- The static icon is fixed at `▣` (mirrors the opencode official mark) and cannot be changed

### Disable

- `OPENCODE_DISABLE_TERMINAL_TITLE=1` disables the title feature
- The "Disable terminal title" toggle in the TUI settings also applies (`terminal_title_enabled`)

## Uninstall

- npm: remove `opencode-zed-status` from `tui.json` and restart
- Local files: remove the corresponding paths from `tui.json` and restart

Do not mix both install methods — the plugin would load twice (double animation / double bell).