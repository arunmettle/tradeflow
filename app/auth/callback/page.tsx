"use client";

import { useEffect, useState } from "react";

function parseAuthParams() {
  const hash = window.location.hash.replace(/^#/, "");
  const search = window.location.search.replace(/^\?/, "");
  const raw = hash || search;
  const params = new URLSearchParams(raw);

  return {
    accessToken: params.get("access_token") ?? "",
    refreshToken: params.get("refresh_token") ?? "",
    expiresIn: Number(params.get("expires_in") ?? 3600),
  };
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { accessToken, refreshToken, expiresIn } = parseAuthParams();
      if (!accessToken || !refreshToken) {
        setError("Missing auth tokens in callback.");
        return;
      }

      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
        }),
      });

      if (!response.ok) {
        setError("Could not complete sign in callback.");
        return;
      }

      window.location.href = "/quotes";
    };

    run();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Completing sign in...</h1>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Please wait while we finish authentication.</p>
        )}
      </div>
    </main>
  );
}
