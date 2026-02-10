import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentAuthUserAsync, ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";

export default async function ProfilePage() {
  const user = await getCurrentAuthUserAsync();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const tradie = await getCurrentTradieAsync();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const publicProfileUrl = `${baseUrl}/t/${encodeURIComponent(tradie.slug)}`;

  async function signOutActionAsync() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    cookieStore.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your account access and tradie profile settings.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email || "-"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">User ID</dt>
              <dd className="font-mono text-xs text-slate-700">{user.id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Business Profile</h2>
          <p className="mt-2 text-sm text-slate-600">
            Edit testimonials, projects, branding, and contact details on your tradie page.
          </p>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-slate-600">
                <span className="font-medium text-slate-900">Public request link</span>
                <span className="ml-2 text-xs text-slate-500">(share with customers)</span>
              </div>
              <a
                href={publicProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800"
              >
                {publicProfileUrl}
              </a>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/tradie"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open tradie profile
            </Link>
            <Link
              href="/quotes"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Go to dashboard
            </Link>
          </div>
        </section>

        <form action={signOutActionAsync} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Session</h2>
          <p className="mt-2 text-sm text-slate-600">Sign out from this device.</p>
          <button
            type="submit"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
