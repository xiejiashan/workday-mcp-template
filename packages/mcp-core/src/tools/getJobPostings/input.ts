import type { Services } from "../../services/types.js";
import { isRecord } from "../../utils/json-helpers.js";

export type GetJobPostingsInput = {
  tenant: string | undefined;
  career_site: string | undefined;
  query: Record<string, string> | undefined;
};

export function resolveGetJobPostingsInput(args: {
  input: unknown;
  services: Services;
}): GetJobPostingsInput {
  const { input, services } = args;
  const tenant =
    isRecord(input) && typeof input.tenant === "string"
      ? input.tenant
      : services.workdayClients.tenantId;
  const career_site =
    isRecord(input) && typeof input.career_site === "string"
      ? input.career_site
      : undefined;
  const query =
    isRecord(input) && isRecord(input.query)
      ? (Object.fromEntries(
          Object.entries(input.query)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string])
        ) as Record<string, string>)
      : undefined;
  return { tenant, career_site, query };
}
