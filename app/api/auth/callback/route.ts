import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const ONE_DAY = 60 * 60 * 24;

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token, expires_in } = (await request.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Invalid callback payload." }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ACCESS_COOKIE, access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expires_in ?? ONE_DAY,
    });
    res.cookies.set(REFRESH_COOKIE, refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
