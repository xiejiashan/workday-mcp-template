import type { WorkdayClients } from "./types.js";
import type { ServerConfig } from "../config/schema.js";

export function createWorkdayClients(config: ServerConfig): WorkdayClients {
  const { workday } = config;
  return {
    get tenantId() {
      return workday.tenantId;
    },
    get baseUrl() {
      return workday.baseUrl;
    },
  };
}
