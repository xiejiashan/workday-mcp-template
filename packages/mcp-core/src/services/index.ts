import type { ServerConfig } from "../config/schema.js";
import type { Services } from "./types.js";
import { createLogger } from "./logger.js";
import { createAuth } from "./auth.js";
import { createHttpClient } from "./httpClient.js";
import { createWorkdayClients } from "./workday.js";

export type {
  Logger,
  Auth,
  HttpClient,
  WorkdayClients,
  Services,
} from "./types.js";
export { createLogger } from "./logger.js";
export { createAuth } from "./auth.js";
export { createHttpClient } from "./httpClient.js";
export { createWorkdayClients } from "./workday.js";

export function createServices(config: ServerConfig): Services {
  return {
    config,
    logger: createLogger(config),
    auth: createAuth(config),
    httpClient: createHttpClient(),
    workdayClients: createWorkdayClients(config),
  };
}
