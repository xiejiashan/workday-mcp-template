import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { loadConfig } from "./config/load.js";
import { createBareMcpServer } from "./mcpServer.js";
import { createServices } from "./services/index.js";
import { registerDefault, type ToolRegistrar } from "./tools/register.js";

export type BootstrapOptions = {
  configPath?: string;
  /** Extra registrar run after the default one (e.g. Workday tools). */
  registerTools?: ToolRegistrar;
};

export type BootstrapHandle = {
  server: McpServer;
  /** Present when transport is HTTP. */
  url?: string;
  close: () => Promise<void>;
};

function sendNotFound(res: ServerResponse) {
  res.statusCode = 404;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found" }));
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function acceptsEventStream(req: IncomingMessage): boolean {
  const accept = req.headers.accept ?? "";
  return accept.includes("text/event-stream");
}

export async function bootstrap(
  options: BootstrapOptions = {}
): Promise<BootstrapHandle> {
  const config = loadConfig({ configPath: options.configPath });
  const services = createServices(config);
  const server = createBareMcpServer({
    name: config.name,
    version: config.version,
  });

  await registerDefault(server, services);
  if (options.registerTools) {
    await Promise.resolve(options.registerTools(server, services));
  }

  if (config.transport === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return {
      server,
      close: async () => {
        await Promise.allSettled([server.close(), transport.close()]);
      },
    };
  }

  const httpConfig = config.http ?? {
    port: 8787,
    host: "127.0.0.1",
    path: "/mcp",
  };
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const requestUrl = req.url ?? "/";
      const base = `http://${req.headers.host ?? `${httpConfig.host}:${httpConfig.port}`}`;
      const { pathname } = new URL(requestUrl, base);

      if (pathname === "/" || pathname === "/health") {
        sendJson(res, 200, {
          ok: true,
          message: "MCP server is running",
          transport: "streamable-http",
          endpoint: httpConfig.path,
          tools: ["ping"],
        });
        return;
      }
      if (pathname !== httpConfig.path) {
        sendNotFound(res);
        return;
      }
      if (!acceptsEventStream(req)) {
        sendJson(res, 200, {
          message:
            "MCP Streamable HTTP endpoint. Use an MCP client that sends Accept: text/event-stream.",
          endpoint: httpConfig.path,
          health: `http://${httpConfig.host}:${httpConfig.port}/health`,
        });
        return;
      }
      transport.handleRequest(req, res).catch((err: unknown) => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
        }
        res.end(JSON.stringify({ error: "Internal server error" }));
        services.logger.error("MCP transport error", err);
      });
    }
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(httpConfig.port, httpConfig.host, () => resolve());
  });

  const url = `http://${httpConfig.host}:${httpConfig.port}${httpConfig.path}`;
  services.logger.info(`MCP server listening at ${url}`);

  return {
    server,
    url,
    close: async () => {
      await Promise.allSettled([server.close(), transport.close()]);
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err?: Error) => (err ? reject(err) : resolve()));
      });
    },
  };
}
