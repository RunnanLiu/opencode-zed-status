/**
 * OpenCode V2 CLI plugin: Zed terminal status feedback.
 *
 * V2 plugin contract: the package's `./tui` entrypoint must default-export an
 * `{ id, setup }` definition (validated by the host loader); `setup` receives
 * the plugin context and returns a cleanup function. Zero runtime imports
 * beyond this package — `setup` only needs to match the shape.
 *
 * Installs:
 * - npm:        cli.json → "plugins": ["opencode-zed-status"]
 * - local dir:  cli.json → "plugins": ["file:///<path-to-this-repo>"]
 *
 * Single-writer contract: set cli.json → "terminal": { "title": false } so the
 * built-in title writer stands down and this plugin owns the terminal title.
 *
 * @typedef {Object} ZedStatusContext
 * @property {{ setTerminalTitle(title: string): void }} renderer OpenTUI renderer.
 * @property {{
 *   on(type: string, handler: (event: { data: any }) => void): () => void,
 *   session: {
 *     get(sessionID: string): { id: string, title?: string, parentID?: string } | undefined,
 *     status(sessionID: string): "idle" | "running",
 *   },
 * }} data Typed server-event subscription + session data.
 * @property {{ router: { current(): { type: string, sessionID?: string } | undefined } }} ui Client-local UI state.
 */

import { title } from "./title.js"
import { bell } from "./bell.js"

export default {
  id: "opencode-zed-status",

  /**
   * @param {ZedStatusContext} ctx
   * @returns {() => void} cleanup
   */
  setup(ctx) {
    const cleanups = [title(ctx), bell(ctx)]
    return () => {
      for (const dispose of cleanups) {
        try {
          dispose()
        } catch {}
      }
    }
  },
}
