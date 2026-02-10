import { NextResponse } from "next/server";
import { getAppBaseUrl, getSupabaseAuthConfig } from "@/lib/auth/config";

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
    const emailRedirectTo = `${getAppBaseUrl()}/auth/callback`;

    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        options: { emailRedirectTo },
      }),
    });

    const data = (await response.json()) as {
      error_description?: string;
      msg?: string;
      user?: unknown;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error_description ?? data.msg ?? "Sign up failed." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Account created. Check your email to verify and activate your account before signing in.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
