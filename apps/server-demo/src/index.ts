import { startHttpServer } from "@workday-mcp/mcp-core";

const port = Number.parseInt(process.env.PORT ?? "", 10) || 8787;
const host = process.env.HOST ?? "127.0.0.1";

const started = await startHttpServer({ port, host });

 
console.log(`MCP server listening at ${started.url}`);
