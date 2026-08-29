const bellTui = async (api) => {
  const bell = () => {
    try {
      process.stdout.write("\x07");
    } catch {}
  };
  api.event.on("session.idle", bell);
  api.event.on("permission.asked", bell);
  api.event.on("question.asked", bell);
};

export { bellTui };
export default { id: "zed-bell", tui: bellTui };