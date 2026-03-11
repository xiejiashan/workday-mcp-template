import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Services } from "../services/types.js";
import { fetchGet } from "../services/httpClient.js";
import { stringifyJson } from "../utils/json-helpers.js";
import { buildWorkdayJobsUrl } from "./getJobPostings/url.js";
import { resolveGetJobPostingsInput } from "./getJobPostings/input.js";
export type ToolRegistrar = (
  server: McpServer,
  services: Services
) => void | Promise<void>;

export async function registerDefault(
  server: McpServer,
  services: Services
): Promise<void> {
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check tool (returns pong).",
    },
    async () => ({
      content: [{ type: "text", text: "pong" }],
    })
  );

  server.registerTool(
    "get_job_postings",
    {
      title: "Get job postings",
      description:
        "Fetch job postings from Workday Jobs using the CXS endpoint.",
      inputSchema: z
        .object({
          tenant: z.string().optional(),
          career_site: z.string(),
          query: z.record(z.string(), z.string()).optional(),
        })
        .strict(),
    },
    async (input: unknown) => {
      const { tenant, career_site, query } = resolveGetJobPostingsInput({
        input,
        services,
      });

      if (!career_site) {
        return {
          content: [
            { type: "text", text: "Missing required input: career_site" },
          ],
          isError: true,
        };
      }
      if (!tenant) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required input: tenant (or configure workday.tenantId)",
            },
          ],
          isError: true,
        };
      }

      const url = buildWorkdayJobsUrl({ tenant, career_site, query });
      services.logger.info(`Fetching job postings: ${url}`);

      const result = await fetchGet(services.httpClient, url);

      if (!result.ok) {
        return {
          content: [
            {
              type: "text",
              text: stringifyJson({
                error: "Upstream request failed",
                status: result.status,
                statusText: result.statusText,
                contentType: result.contentType,
                body: result.text.slice(0, 20_000),
                url,
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: result.json ? stringifyJson(result.json) : result.text,
          },
        ],
      };
    }
  );
}
