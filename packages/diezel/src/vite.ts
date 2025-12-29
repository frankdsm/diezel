import type { Plugin, ViteDevServer } from "vite";
import type { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server";
import { existsSync } from "fs";
import { join } from "path";
import {
  discoverRoutes,
  matchRoute,
  findLayouts,
  type DiscoveredRoutes,
} from "./routes";
import { useServerPlugin } from "./use-server-plugin";
import { useClientPlugin } from "./use-client-plugin";

interface DiezelOptions {
  appDir?: string;
  apiDir?: string;
}

const VIRTUAL_CLIENT_ID = "virtual:diezel-client";
const RESOLVED_VIRTUAL_CLIENT_ID = "\0" + VIRTUAL_CLIENT_ID;

const CLIENT_ENTRY_CODE = `
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";

const modules = import.meta.glob(
  ["/src/components/**/*.tsx", "/src/app/**/*.tsx"],
  { eager: false }
);

async function hydrate() {
  const islands = document.querySelectorAll("[data-diezel-island]");

  for (const island of islands) {
    const modulePath = island.dataset.diezelIsland;
    const componentName = island.dataset.diezelComponent;
    const propsJson = island.dataset.diezelProps;

    if (!modulePath || !componentName) continue;

    const loader = modules[modulePath];
    if (!loader) {
      console.warn("[Diezel] Module not found:", modulePath);
      continue;
    }

    try {
      const mod = await loader();
      const Component = mod[componentName] || mod.default;

      if (!Component) {
        console.warn("[Diezel] Component " + componentName + " not found in " + modulePath);
        continue;
      }

      const props = propsJson ? JSON.parse(propsJson) : {};
      hydrateRoot(island, createElement(Component, props));
    } catch (e) {
      console.error("[Diezel] Hydration failed for " + componentName + ":", e);
    }
  }
}

hydrate();
`;

export function diezel(options: DiezelOptions = {}): Plugin[] {
  const appDir = options.appDir ?? "./src/app";

  let server: ViteDevServer;
  let routes: DiscoveredRoutes | null = null;

  const mainPlugin: Plugin = {
    name: "diezel",
    enforce: "pre",

    config() {
      return {
        resolve: {
          dedupe: ["react", "react-dom"],
        },
      };
    },

    resolveId(id) {
      if (id === VIRTUAL_CLIENT_ID) {
        return RESOLVED_VIRTUAL_CLIENT_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
        return CLIENT_ENTRY_CODE;
      }
    },

    configureServer(_server) {
      server = _server;

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "/";
        const [pathname, search] = url.split("?");

        // Skip Vite internals and static files
        if (
          pathname.startsWith("/@") ||
          pathname.startsWith("/node_modules/") ||
          pathname.startsWith("/src/") ||
          pathname.match(/\.(ts|tsx|js|jsx|css|ico|png|jpg|svg|woff|woff2)$/)
        ) {
          return next();
        }

        try {
          // Handle server actions
          if (pathname === "/_server-action" && req.method === "POST") {
            const bodyChunks: Buffer[] = [];
            await new Promise<void>((resolve) => {
              req.on("data", (chunk: Buffer) => bodyChunks.push(chunk));
              req.on("end", resolve);
            });

            const bodyText = Buffer.concat(bodyChunks).toString();
            const { actionId } = JSON.parse(bodyText) as { actionId: string };

            // Extract file path from actionId (format: filepath:functionName)
            const [filePath] = actionId.split(":");
            if (filePath && existsSync(filePath)) {
              // Load the module with SSR to register the actions
              const vitePath = "/" + filePath.replace(process.cwd() + "/", "");
              await server.ssrLoadModule(vitePath);
            }

            // Load server-actions via SSR to use the same registry instance
            const serverActionsModule = await server.ssrLoadModule(
              "diezel/server-actions"
            );
            const handleServerAction = serverActionsModule.handleServerAction as (
              req: Request
            ) => Promise<Response>;

            const fetchReq = new Request("http://localhost/_server-action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: bodyText,
            });

            const response = await handleServerAction(fetchReq);
            res.statusCode = response.status;
            res.setHeader("Content-Type", "application/json");
            res.end(await response.text());
            return;
          }

          // Handle API routes
          if (pathname.startsWith("/api")) {
            const apiEntryPath = join(process.cwd(), "src", "api", "index.ts");
            if (!existsSync(apiEntryPath)) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "API not configured" }));
              return;
            }

            const apiModule = await server.ssrLoadModule("/src/api/index.ts");
            const app = apiModule.default as Hono;

            // Create fetch request - strip /api prefix since Hono routes are relative
            const protocol = "http";
            const host = req.headers.host || "localhost";
            const apiPath = pathname.replace(/^\/api/, "") || "/";
            const apiUrl = `${protocol}://${host}${apiPath}${
              search ? "?" + search : ""
            }`;

            // Read body if present
            const bodyChunks: Buffer[] = [];
            await new Promise<void>((resolve) => {
              req.on("data", (chunk: Buffer) => bodyChunks.push(chunk));
              req.on("end", resolve);
            });

            const body =
              bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

            const fetchReq = new Request(apiUrl, {
              method: req.method,
              headers: req.headers as any,
              body: ["GET", "HEAD"].includes(req.method || "")
                ? undefined
                : body,
            });

            // Use Hono's fetch handler
            const response = await app.fetch(fetchReq);

            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            const responseBody = await response.text();
            res.end(responseBody);
            return;
          }

          // Discover routes (cached after first request in production, always fresh in dev)
          routes = await discoverRoutes(appDir);

          // Find matching page route
          let matchedRoute = null;
          let params: Record<string, string> = {};

          for (const route of routes.pages) {
            const match = matchRoute(pathname, route);
            if (match) {
              matchedRoute = route;
              params = match;
              break;
            }
          }

          if (!matchedRoute) {
            return next();
          }

          // Convert absolute path to Vite-compatible path
          const toVitePath = (absPath: string) =>
            "/" + absPath.replace(process.cwd() + "/", "");

          // Load page component
          const pageModule = await server.ssrLoadModule(
            toVitePath(matchedRoute.filePath)
          );
          const PageComponent = pageModule.default;

          // Load applicable layouts
          const layoutPaths = findLayouts(matchedRoute.pattern, routes.layouts);
          const layouts = await Promise.all(
            layoutPaths.map(async (path) => {
              const mod = await server.ssrLoadModule(toVitePath(path));
              return mod.default;
            })
          );

          // Render page with params and searchParams
          const searchParams = new URLSearchParams(search || "");
          let content = await PageComponent({ params, searchParams });

          // Wrap in layouts (innermost first)
          for (let i = layouts.length - 1; i >= 0; i--) {
            content = await layouts[i]({ children: content, params });
          }

          // Render to HTML stream
          const stream = await renderToReadableStream(content as any);
          const html = await streamToString(stream);

          // Inject Vite dev scripts and client hydration
          const htmlWithAssets = html
            .replace(
              "</head>",
              `<script type="module" src="/@vite/client"></script>
<script type="module">
import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script>
<link rel="stylesheet" href="/src/app/globals.css">
</head>`
            )
            .replace(
              "</body>",
              `<script type="module" src="/@id/__x00__virtual:diezel-client"></script>
</body>`
            );

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.end(`<!DOCTYPE html>${htmlWithAssets}`);
        } catch (error) {
          console.error("Diezel error:", error);
          next(error);
        }
      });
    },

    handleHotUpdate({ file, server }) {
      // Reload on any source file change
      if (!/\.(tsx?|jsx?)$/.test(file)) return;
      if (!file.includes("/src/")) return;

      server.ws.send({ type: "full-reload" });
      return [];
    },
  };

  // Return array of plugins: main plugin + transforms
  return [mainPlugin, useServerPlugin(), useClientPlugin()];
}

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

export default diezel;
