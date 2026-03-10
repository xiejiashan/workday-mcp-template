import {
  createServer,
  IncomingMessage,
  Server as HttpServer,
  ServerResponse,
} from "node:http";
import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createMcpServer } from "./mcpServer.ts";

export type StartHttpServerOptions = {
  port: number;
  host?: string;
  /**
   * MCP endpoint path. Defaults to `/mcp`.
   */
  path?: string;
  /**
   * Provide an already-configured McpServer. If omitted, `createMcpServer()` is used.
   */
  server?: McpServer;
};

export type StartedHttpServer = {
  url: string;
  server: McpServer;
  httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>;
  close: () => Promise<void>;
};

function sendNotFound(res: ServerResponse) {
  res.statusCode = 404;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found" }));
}

export async function startHttpServer(
  options: StartHttpServerOptions
): Promise<StartedHttpServer> {
  const host = options.host ?? "127.0.0.1";
  const path = options.path ?? "/mcp";

  const mcpServer = options.server ?? createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const requestUrl = req.url ?? "/";
      const base = `http://${req.headers.host ?? `${host}:${options.port}`}`;
      const { pathname } = new URL(requestUrl, base);

      if (pathname !== path) {
        sendNotFound(res);
        return;
      }

      transport.handleRequest(req, res).catch((err: unknown) => {
        // Avoid leaking internals; ensure the socket is closed cleanly.
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
        }
        res.end(JSON.stringify({ error: "Internal server error" }));
         
        console.error("MCP transport error", err);
      });
    }
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(options.port, host, () => resolve());
  });

  const url = `http://${host}:${options.port}${path}`;

  return {
    url,
    server: mcpServer,
    httpServer,
    close: async () => {
      await Promise.allSettled([mcpServer.close(), transport.close()]);
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err?: Error) => (err ? reject(err) : resolve()));
      });
    },
  };
}
