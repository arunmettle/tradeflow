import { NextResponse } from "next/server";
import { getSupabaseAuthConfig } from "@/lib/auth/config";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const ONE_DAY = 60 * 60 * 24;

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { supabaseUrl, supabaseAnonKey } = getSupabaseAuthConfig();

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
      msg?: string;
    };

    if (!response.ok || !data.access_token || !data.refresh_token) {
      return NextResponse.json(
        {
          error:
            data.error_description ??
            data.msg ??
            "Sign in failed. Ensure email is verified and credentials are correct.",
        },
        { status: response.status || 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ACCESS_COOKIE, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.expires_in ?? ONE_DAY,
    });
    res.cookies.set(REFRESH_COOKIE, data.refresh_token, {
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
