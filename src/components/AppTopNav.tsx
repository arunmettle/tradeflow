import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

type Props = {
  user: {
    email?: string;
    name?: string;
  };
};

export function AppTopNav({ user }: Props) {
  async function signOutActionAsync() {
    "use server";

    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set(REFRESH_COOKIE, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/auth/sign-in");
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/quotes" className="text-sm font-semibold text-slate-900">
              TradeFlow
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:inline">
                {user.name || user.email || "Signed in"}
              </span>
              <form action={signOutActionAsync}>
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <nav
            aria-label="Primary"
            className="-mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:w-auto sm:px-0 sm:pb-0"
          >
            <Link
              href="/quotes"
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Quotes
            </Link>
            <Link
              href="/leads"
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Leads
            </Link>
            <Link
              href="/profile"
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
