export function buildWorkdayJobsUrl(args: {
  tenant: string;
  career_site: string;
  query?: Record<string, string>;
}): string {
  const base = `https://${encodeURIComponent(args.tenant)}.wd5.myworkdayjobs.com/wday/cxs/${encodeURIComponent(args.tenant)}/${encodeURIComponent(args.career_site)}/jobs`;
  const qs = new URLSearchParams(args.query ?? {});
  const url = new URL(base);
  if ([...qs.keys()].length > 0) url.search = qs.toString();
  return url.toString();
}
