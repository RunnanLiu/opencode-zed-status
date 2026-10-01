// Zero-dependency mock-contract suite: simulates the OpenCode V2 CLI plugin
// host and asserts the full behavior matrix of tui.js / title.js / bell.js.
// The event names and payload shapes encoded here are verified against the
// OpenCode v2.0.21 host source (built-in opencode.notifications plugin) — if
// a future OpenCode release renames them, this suite is the drift alarm.
// Run: npm test
import plugin from "./tui.js"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let pass = 0
let fail = 0
const ok = (condition, label, extra = "") => {
  if (condition) {
    pass++
    console.log(`  PASS ${label}`)
  } else {
    fail++
    console.log(`  FAIL ${label} ${extra}`)
  }
}

// --- mock host ----------------------------------------------------------
const titles = []
const renderer = { setTerminalTitle: (t) => titles.push(t) }
const handlers = new Map()
const data = {
  on: (type, handler) => {
    if (!handlers.has(type)) handlers.set(type, [])
    handlers.get(type).push(handler)
    return () => {
      const list = handlers.get(type)
      const index = list.indexOf(handler)
      if (index >= 0) list.splice(index, 1)
    }
  },
  session: {
    get: (id) => sessions[id],
    status: (id) => status[id] ?? "idle",
  },
}
const ui = { router: { current: () => route } }

let route = null
const sessions = {
  s1: { id: "s1", title: "Fix login bug" },
  s2: { id: "s2", title: "New session - 2026-10-01T04:00:00.000Z" },
  s3: { id: "s3", title: "child task", parentID: "s1" },
  s4: { id: "s4", title: "A very long session title that definitely exceeds forty characters in total length" },
  s5: { id: "s5", title: "Crashes on save" },
  s6: { id: "s6", title: "Interrupted work" },
}
let status = { s1: "running" }
// Mirrors the host's dispatch ordering: the data store mutates BEFORE event
// handlers run (verified against the v2.0.21 client source). Callers update
// `status` first, then fire.
const fire = (type, payload) => {
  for (const handler of handlers.get(type) ?? []) handler({ data: payload })
}

// capture BEL writes
const realWrite = process.stdout.write.bind(process.stdout)
let belCount = 0
process.stdout.write = (chunk, ...rest) => {
  if (chunk === "\x07") {
    belCount++
    return true
  }
  return realWrite(chunk, ...rest)
}

// --- plugin contract ----------------------------------------------------
console.log("contract:")
ok(typeof plugin === "object" && plugin !== null, "default export is object")
ok(plugin.id === "opencode-zed-status" && typeof plugin.id === "string" && plugin.id.length > 0, "id is non-empty string")
ok(typeof plugin.setup === "function", "setup is a function")

// --- title --------------------------------------------------------------
console.log("title:")
route = { type: "session", sessionID: "s1" }
let cleanup = plugin.setup({ renderer, data, ui })
ok(typeof cleanup === "function", "setup returns cleanup function")

const last = () => titles.at(-1)
ok(last() === "▘ Fix login bug", "immediate tick: running frame 0", `got ${JSON.stringify(last())}`)
await sleep(260)
ok(last() === "▝ Fix login bug", "spinner advances (frame clock)", `got ${JSON.stringify(last())}`)

status = {}
await sleep(260)
ok(last() === "▣ Fix login bug", "idle → glyph restored", `got ${JSON.stringify(last())}`)

let length = titles.length
await sleep(260)
ok(titles.length === length, "unchanged desired within 1s window is skipped (diff)")

await sleep(1000)
ok(titles.length === length + 1 && last() === "▣ Fix login bug", "self-heal re-asserts after 1s", `got ${JSON.stringify(last())}`)

route = { type: "home" }
await sleep(260)
ok(last() === "▣ OpenCode", "home route → ▣ OpenCode", `got ${JSON.stringify(last())}`)

route = { type: "session", sessionID: "s2" }
await sleep(260)
ok(last() === "▣ OpenCode", "fallback title session → ▣ OpenCode", `got ${JSON.stringify(last())}`)

route = { type: "plugin", id: "x", name: "x" }
await sleep(260)
ok(last() === "▣ OpenCode", "non-session route → ▣ OpenCode", `got ${JSON.stringify(last())}`)

route = { type: "session", sessionID: "missing" }
await sleep(260)
ok(last() === "▣ OpenCode", "missing session → ▣ OpenCode", `got ${JSON.stringify(last())}`)

route = { type: "session", sessionID: "s4" }
await sleep(260)
const truncated = `▣ ${sessions.s4.title.slice(0, 37)}…`
ok(last() === truncated, "long title truncated to 40 with …", `got ${JSON.stringify(last())}`)

// zero-latency status transitions: no sleep here — immediacy is the assertion.
// Uses the sub-agent session s3 so the bell (which shares these events) stays
// silent per its locked semantics, keeping the bell counts below unaffected.
route = { type: "session", sessionID: "s3" }
status = { s3: "running" }
fire("session.execution.started", { sessionID: "s3" })
ok(last() === "▘ child task", "started event → immediate first spinner frame", `got ${JSON.stringify(last())}`)
status = {}
fire("session.execution.succeeded", { sessionID: "s3" })
ok(last() === "▣ child task", "terminal event → immediate idle glyph (no tick wait)", `got ${JSON.stringify(last())}`)

// --- bell ---------------------------------------------------------------
console.log("bell:")
fire("permission.asked", { id: "p1" })
ok(belCount === 1, "permission.asked rings", `count=${belCount}`)
fire("permission.asked", { id: "p1" })
ok(belCount === 1, "duplicate permission id does not re-ring (dedup)", `count=${belCount}`)
fire("permission.replied", { requestID: "p1" })
fire("permission.asked", { id: "p1" })
ok(belCount === 2, "re-asked after replied rings again", `count=${belCount}`)

fire("form.created", { form: { id: "f1" } })
ok(belCount === 3, "form.created rings (V2 question)", `count=${belCount}`)
fire("form.created", { form: { id: "f1" } })
ok(belCount === 3, "duplicate form id does not re-ring", `count=${belCount}`)
fire("form.cancelled", { id: "f1" })
fire("form.created", { form: { id: "f1" } })
ok(belCount === 4, "re-created form after cancel rings again", `count=${belCount}`)

fire("session.execution.succeeded", { sessionID: "s3" })
ok(belCount === 4, "sub-agent completion stays silent", `count=${belCount}`)
fire("session.execution.succeeded", { sessionID: "s1" })
ok(belCount === 5, "top-level completion rings", `count=${belCount}`)
fire("session.execution.succeeded", { sessionID: "s1" })
ok(belCount === 5, "duplicate terminal event does not re-ring", `count=${belCount}`)
fire("session.execution.started", { sessionID: "s1" })
fire("session.execution.succeeded", { sessionID: "s1" })
ok(belCount === 6, "new execution cycle rings again", `count=${belCount}`)
fire("session.execution.interrupted", { sessionID: "s6" })
ok(belCount === 7, "interrupted completion rings", `count=${belCount}`)
fire("session.execution.failed", { sessionID: "s5" })
ok(belCount === 8, "failed completion rings", `count=${belCount}`)

// --- reload + cleanup ---------------------------------------------------
console.log("cleanup:")
cleanup()
ok(last() === "OpenCode", "dispose resets title to OpenCode", `got ${JSON.stringify(last())}`)
length = titles.length
fire("permission.asked", { id: "p2" })
ok(belCount === 8, "unsubscribed: no bell after dispose", `count=${belCount}`)
await sleep(300)
ok(titles.length === length, "timer cleared: no ticks after dispose")

cleanup = plugin.setup({ renderer, data, ui })
ok(titles.length === length + 1, "reload: setup runs again cleanly", `got ${JSON.stringify(last())}`)
cleanup()
ok(last() === "OpenCode", "second dispose resets again", `got ${JSON.stringify(last())}`)

process.stdout.write = realWrite
console.log(`\n${pass} passed, ${fail} failed`)
process.exitCode = fail ? 1 : 0
