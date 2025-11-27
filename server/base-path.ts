export function normalizeBasePath(raw?: string): string {
  const trimmed = (raw ?? "/").trim();
  if (!trimmed || trimmed === "/") return "/";

  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  return withoutSlashes ? `/${withoutSlashes}` : "/";
}
