import { bootstrap } from "@workday-mcp/mcp-core";

process.env.MCP_TRANSPORT = "http";
await bootstrap();
