import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { HttpTransportConfig } from "../config/schema.js";
import { createMcpHttpRequestHandler } from "./httpHandler.js";
import type { Logger } from "../services/types.js";

/**
 * Internal: attaches HTTP transport to an existing MCP server and starts the Node HTTP server.
 * Called by bootstrap when config.transport === "http".
 */
export type AttachHttpTransportOptions = {
  server: McpServer;
  httpConfig: HttpTransportConfig;
  logger: Logger;
};

export type AttachHttpTransportResult = {
  server: McpServer;
  url: string;
  close: () => Promise<void>;
};

export async function attachHttpTransport(
  options: AttachHttpTransportOptions
): Promise<AttachHttpTransportResult> {
  const { server, httpConfig, logger } = options;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);

  const requestHandler = createMcpHttpRequestHandler({
    httpConfig,
    transport,
    logger,
  });
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) =>
    requestHandler(req, res)
  );

  await new Promise<void>((resolve) => {
    httpServer.listen(httpConfig.port, httpConfig.host, () => resolve());
  });

  const url = `http://${httpConfig.host}:${httpConfig.port}${httpConfig.path}`;
  logger.info(`MCP server listening at ${url}`);

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
