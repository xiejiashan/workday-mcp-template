import type { IncomingMessage, ServerResponse } from "node:http";

import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import type { HttpTransportConfig } from "../config/schema.js";
import type { Logger } from "../services/types.js";

export type CreateMcpHttpRequestHandlerOptions = {
  httpConfig: HttpTransportConfig;
  transport: StreamableHTTPServerTransport;
  logger: Logger;
};

function sendNotFound(res: ServerResponse): void {
  res.statusCode = 404;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found" }));
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  body: unknown
): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function acceptsEventStream(req: IncomingMessage): boolean {
  const accept = req.headers.accept ?? "";
  return accept.includes("text/event-stream");
}

/**
 * Returns a request listener that routes /, /health, and the MCP path,
 * and delegates MCP requests to the transport. Used by bootstrap (HTTP path).
 */
export function createMcpHttpRequestHandler(
  options: CreateMcpHttpRequestHandlerOptions
): (req: IncomingMessage, res: ServerResponse) => void {
  const { httpConfig, transport, logger } = options;

  return (req: IncomingMessage, res: ServerResponse) => {
    const requestUrl = req.url ?? "/";
    const base = `http://${req.headers.host ?? `${httpConfig.host}:${httpConfig.port}`}`;
    const { pathname } = new URL(requestUrl, base);

    if (pathname === "/" || pathname === "/health") {
      sendJson(res, 200, {
        ok: true,
        message: "MCP server is running",
        transport: "streamable-http",
        endpoint: httpConfig.path,
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
      logger.error("MCP transport error", err);
    });
  };
}
