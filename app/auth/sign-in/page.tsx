"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { buildOauthAuthorizeUrl } from "@/lib/auth/oauth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleUrl = useMemo(() => buildOauthAuthorizeUrl("google"), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "Could not sign in.");
      return;
    }

    window.location.href = "/quotes";
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access your tradie dashboard.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-4 h-px bg-slate-200" />

        <div className="space-y-2">
          <a
            href={googleUrl}
            className="block w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Continue with Google
          </a>
        </div>

        <p className="mt-5 text-sm text-slate-600">
          New here?{" "}
          <Link className="font-semibold text-slate-900 underline" href="/auth/sign-up">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
