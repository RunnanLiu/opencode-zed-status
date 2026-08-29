import { bellTui } from "./zed-bell.js";
import { titleTui } from "./zed-title.js";

export default {
  id: "opencode-zed-status",
  tui: async (api) => {
    await bellTui(api);
    await titleTui(api);
  },
};