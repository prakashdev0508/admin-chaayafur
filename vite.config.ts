import path from "path";
import type { IncomingMessage, ServerResponse } from "http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function quotationImageProxy(): Plugin {
  const handle = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = req.url ?? "";
    if (!requestUrl.startsWith("/__quotation-image")) {
      next();
      return;
    }

    void (async () => {
      try {
        const target = new URL(
          requestUrl,
          "http://localhost",
        ).searchParams.get("url");
        if (!target || !/^https?:\/\//i.test(target)) {
          res.statusCode = 400;
          res.end("Invalid image url");
          return;
        }

        const upstream = await fetch(target);
        if (!upstream.ok) {
          res.statusCode = upstream.status;
          res.end();
          return;
        }

        const contentType = upstream.headers.get("content-type") ?? "";
        if (!contentType.startsWith("image/")) {
          res.statusCode = 415;
          res.end();
          return;
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.end(buffer);
      } catch {
        if (!res.writableEnded) {
          res.statusCode = 502;
          res.end();
        }
      }
    })();
  };

  return {
    name: "quotation-image-proxy",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), quotationImageProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
