import { ZedBell } from "./zed-bell.js";
import { ZedTitle } from "./zed-title.js";

export default {
  server: async () => {
    const bell = await ZedBell();
    const title = await ZedTitle();
    return {
      event: async (e) => {
        await bell.event(e);
        await title.event(e);
      },
    };
  },
};