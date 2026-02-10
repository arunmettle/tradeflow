import { getAppBaseUrl } from "./config";

export function buildOauthAuthorizeUrl(provider: "google") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return "#";

  const redirectTo = `${getAppBaseUrl()}/auth/callback`;
  const url = new URL(`${base}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}
