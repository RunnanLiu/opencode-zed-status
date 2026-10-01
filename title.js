const GLYPH = "▣"
const FRAMES = ["▘", "▝", "▗", "▖"]
const TICK_MS = 200
const REASSERT_MS = 1000
const MAX_TITLE = 40

// Mirrors OpenCode's canonical fallback-title pattern (session-title-fallback):
// timestamped placeholder titles of root and child sessions never belong in a
// terminal title.
const FALLBACK_TITLE = /^(New session|Child session) - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

// Status-transition lifecycle, the same set the built-in `opencode.notifications`
// consumes. Here the events only trigger an immediate recompute — tick reads
// authoritative state itself — so spinner start/stop has zero latency and zero
// duplicated logic. The host dispatches them after the data store has already
// applied the transition (verified ordering contract, shared with the built-in).
const STATE_EVENTS = [
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.interrupted",
  "session.execution.failed",
]

/**
 * Owns the terminal title (OSC 0): `▣` while idle, quadrant spinner frames
 * while the routed session is running. Format: `▣ <title>`, truncated.
 *
 * Dual-scheduler: status transitions recompute instantly via `STATE_EVENTS`;
 * the 200 ms poll remains the floor for everything without an event source —
 * route changes (client-local, no event API), spinner frame animation, and
 * the unconditional ≤1 s rewrite that self-heals external title overwrites
 * (including the built-in title writer when `terminal.title` is left enabled
 * — worst case a brief flicker, never a lost glyph).
 *
 * @param {import("./tui.js").ZedStatusContext} ctx
 * @returns {() => void} cleanup
 */
export function title(ctx) {
  let timer = null
  let frame = 0
  let lastWritten = null
  let lastWrite = 0

  const write = (desired) => {
    const now = Date.now()
    if (desired === lastWritten && now - lastWrite < REASSERT_MS) return
    lastWritten = desired
    lastWrite = now
    try {
      ctx.renderer.setTerminalTitle(desired)
    } catch {}
  }

  const tick = () => {
    try {
      const route = ctx.ui.router.current()
      if (route?.type !== "session") {
        frame = 0
        write(`${GLYPH} OpenCode`)
        return
      }
      const session = ctx.data.session.get(route.sessionID)
      const title = session?.title && !FALLBACK_TITLE.test(session.title) ? session.title : undefined
      const base = title ? (title.length > MAX_TITLE ? title.slice(0, 37) + "…" : title) : "OpenCode"
      if (ctx.data.session.status(route.sessionID) === "running") {
        write(`${FRAMES[frame++ % FRAMES.length]} ${base}`)
        return
      }
      frame = 0
      write(`${GLYPH} ${base}`)
    } catch {}
  }

  timer = setInterval(tick, TICK_MS)
  tick()
  const unsubscribe = STATE_EVENTS.map((type) => ctx.data.on(type, tick))

  return () => {
    clearInterval(timer)
    for (const off of unsubscribe) {
      try {
        off()
      } catch {}
    }
    try {
      ctx.renderer.setTerminalTitle("OpenCode")
    } catch {}
  }
}
