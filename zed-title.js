export const ZedTitle = async () => {
  const FRAMES = ["▘", "▝", "▗", "▖"];
  const SPIN_MS = 200;
  const MAX_TITLE = 40;

  let timer = null;
  let frame = 0;
  let sessionTitle = "";
  const states = new Map();

  const write = (text) => {
    try {
      process.stdout.write(`\x1b]0;${text}\x07`);
    } catch {}
  };

  const truncate = (t) => {
    if (t.length <= MAX_TITLE) return t;
    return t.slice(0, MAX_TITLE - 3) + "...";
  };

  const baseTitle = () => {
    return sessionTitle ? `OC | ${truncate(sessionTitle)}` : "OpenCode";
  };

  const frameTitle = () => {
    return `${FRAMES[frame]} ${baseTitle()}`;
  };

  const start = () => {
    if (timer) return;
    write(frameTitle());
    timer = setInterval(() => {
      frame = (frame + 1) % FRAMES.length;
      write(frameTitle());
    }, SPIN_MS);
  };

  const stopIfIdle = () => {
    if (states.size > 0) return;
    if (timer) {
      clearInterval(timer);
      timer = null;
      frame = 0;
    }
    write(baseTitle());
  };

  return {
    event: async ({ event }) => {
      try {
        if (event.type === "session.updated") {
          sessionTitle = event.properties?.info?.title ?? sessionTitle;
          return;
        }
        if (event.type === "session.status") {
          const sid = event.properties.sessionID;
          const st = event.properties.status?.type;
          if (st === "busy" || st === "retry") {
            states.set(sid, st);
            start();
          } else if (st === "idle") {
            states.delete(sid);
            stopIfIdle();
          }
          return;
        }
        if (event.type === "session.idle" || event.type === "session.deleted") {
          states.delete(event.properties.sessionID);
          stopIfIdle();
          return;
        }
      } catch {}
    },
  };
};