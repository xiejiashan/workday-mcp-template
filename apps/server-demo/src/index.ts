import { bootstrap } from "@workday-mcp/mcp-core";
import { openApiToolRegistrar } from "@workday-mcp/workday-tools";

process.env.MCP_TRANSPORT = "http";
// Registered tools include Workday OpenAPI tools (e.g. listJobPostings from get_job_postings).
await bootstrap({
  configPath: "config.json",
  registerTools: openApiToolRegistrar,
});
