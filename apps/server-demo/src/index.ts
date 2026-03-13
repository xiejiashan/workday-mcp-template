import { bootstrap } from "@workday-mcp/mcp-core";
import { openApiToolRegistrar } from "@workday-mcp/workday-tools";

process.env.MCP_TRANSPORT = "http";
await bootstrap({
  configPath: "config.json",
  registerTools: openApiToolRegistrar,
});
