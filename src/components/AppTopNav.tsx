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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/quotes" className="text-sm font-semibold text-slate-900">
          TradeFlow
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link
            href="/quotes"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Quotes
          </Link>
          <Link
            href="/leads"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Leads
          </Link>
          <Link
            href="/profile"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Profile
          </Link>
        </nav>

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
    </header>
  );
}
