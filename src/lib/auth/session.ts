import { cookies } from "next/headers";

export const ACCESS_COOKIE = "tf_access_token";
export const REFRESH_COOKIE = "tf_refresh_token";

type JwtPayload = {
  sub?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  exp?: number;
};

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export async function getCurrentAuthUserAsync() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  if (isTokenExpired(accessToken)) return null;

  const payload = decodeJwtPayload(accessToken);
  if (!payload?.sub) return null;

  return {
    id: payload.sub,
    email: payload.email ?? "",
    name:
      (typeof payload.user_metadata?.name === "string" && payload.user_metadata.name) ||
      (typeof payload.user_metadata?.full_name === "string" &&
        payload.user_metadata.full_name) ||
      "",
    accessToken,
  };
}
