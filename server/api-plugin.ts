import type { Plugin } from "vite";

import { handleAnalyze } from "./analyze";

export const apiPlugin = (): Plugin => {
  const middleware = async (req: any, res: any, next: any) => {
    if (req.url && req.url.split("?")[0] === "/api/analyze") {
      try {
        await handleAnalyze(req, res);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: "Internal server error",
            detail: err instanceof Error ? err.message : "unknown",
          }),
        );
      }
      return;
    }
    next();
  };

  return {
    name: "maternal-care-api-plugin",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};
