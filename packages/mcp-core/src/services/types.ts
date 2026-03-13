import type { ServerConfig } from "../config/schema.js";

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface Auth {
  validate(): Promise<boolean>;
}

export interface HttpClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

export interface Services {
  logger: Logger;
  auth: Auth;
  httpClient: HttpClient;
  config: ServerConfig;
}
