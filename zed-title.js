const GLYPH = "▣";
const FRAMES = ["▘", "▝", "▗", "▖"];
const TICK_MS = 200;
const REFRESH_MS = 1000;
const MAX_TITLE = 40;

const isDefaultTitle = (t) =>
  /^(New session - |Child session - )\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(t || "");

const titleTui = async (api) => {
  let timer = null;
  let frame = 0;
  let lastWritten = null;
  let lastWrite = 0;

  const enabled = () => {
    if (process.env.OPENCODE_DISABLE_TERMINAL_TITLE) return false;
    try {
      return api.kv.get("terminal_title_enabled", true) !== false;
    } catch {
      return true;
    }
  };

  const setTitle = (title) => {
    try {
      api.renderer?.setTerminalTitle?.(title);
    } catch {}
  };

  const write = (desired) => {
    const now = Date.now();
    if (desired === lastWritten && now - lastWrite < REFRESH_MS) return;
    lastWritten = desired;
    lastWrite = now;
    setTitle(desired);
  };

  const baseTitle = (sessionID) => {
    const title = sessionID ? api.state.session.get(sessionID)?.title : undefined;
    if (title && !isDefaultTitle(title)) {
      return `OC | ${title.length > MAX_TITLE ? title.slice(0, MAX_TITLE - 3) + "..." : title}`;
    }
    return "OpenCode";
  };

  const isBusy = (sessionID) => {
    try {
      const status = api.state.session.status(sessionID);
      return status?.type === "busy" || status?.type === "retry";
    } catch {
      return false;
    }
  };

  const tick = () => {
    try {
      if (!enabled()) return;
      const route = api.route.current;
      const sessionID = route.name === "session" ? route.params?.sessionID : undefined;
      if (!sessionID) {
        write(`${GLYPH} OpenCode`);
        return;
      }
      const busy = isBusy(sessionID);
      const base = baseTitle(sessionID);
      const desired = busy ? `${FRAMES[frame++ % FRAMES.length]} ${base}` : `${GLYPH} ${base}`;
      if (!busy) frame = 0;
      write(desired);
    } catch {}
  };

  api.lifecycle.onDispose(() => {
    if (timer) clearInterval(timer);
    try {
      api.renderer?.setTerminalTitle?.("OpenCode");
    } catch {}
  });

  timer = setInterval(tick, TICK_MS);
  tick();
};

export { titleTui };
export default { id: "zed-title", tui: titleTui };