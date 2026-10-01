const BELL = "\x07"

/**
 * Rings the terminal bell (BEL) so Zed flags the thread when unfocused.
 *
 * Semantics (locked): ring only for what needs the user — top-level session
 * completion and permission/form prompts at any level. Sub-agent completion
 * stays silent. The event set mirrors the built-in `opencode.notifications`
 * plugin, so its behavior can never silently drift from OpenCode's own
 * notion of "session ended" or "input needed". This plugin only adds the BEL
 * channel; system notifications and sounds remain the built-in attention
 * system's job.
 *
 * @param {import("./tui.js").ZedStatusContext} ctx
 * @returns {() => void} cleanup
 */
export function bell(ctx) {
  const ring = () => {
    try {
      process.stdout.write(BELL)
    } catch {}
  }

  const done = (sessionID) => {
    try {
      if (ctx.data.session.get(sessionID)?.parentID) return
    } catch {}
    ring()
  }

  // Dedup mirrors the built-in plugin: the server may replay events
  // (reconnect, resubscribe) and a replay must not ring twice.
  const terminal = new Set()
  const permissions = new Set()
  const forms = new Set()

  const once = (set, key, run) => {
    if (set.has(key)) return
    set.add(key)
    run(key)
  }

  const unsubscribe = [
    ctx.data.on("session.execution.started", (event) => terminal.delete(event.data.sessionID)),
    ctx.data.on("session.execution.succeeded", (event) => once(terminal, event.data.sessionID, done)),
    ctx.data.on("session.execution.interrupted", (event) => once(terminal, event.data.sessionID, done)),
    ctx.data.on("session.execution.failed", (event) => once(terminal, event.data.sessionID, done)),
    ctx.data.on("permission.asked", (event) => once(permissions, event.data.id, ring)),
    ctx.data.on("permission.replied", (event) => permissions.delete(event.data.requestID)),
    ctx.data.on("form.created", (event) => once(forms, event.data.form.id, ring)),
    ctx.data.on("form.replied", (event) => forms.delete(event.data.id)),
    ctx.data.on("form.cancelled", (event) => forms.delete(event.data.id)),
  ]

  return () => {
    for (const off of unsubscribe) {
      try {
        off()
      } catch {}
    }
  }
}
