import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAuthUserAsync } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentAuthUserAsync();
  if (user) {
    redirect("/quotes");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:py-14">
        <header className="grid gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 md:grid-cols-2 md:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">TradeFlow</p>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Quotes without chaos for busy tradies.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Capture leads, generate AI draft quotes, edit pricing fast, and share accept/decline links.
              Built to remove back-and-forth, missed details, and spreadsheet invoicing pain.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/sign-up"
                className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Start free
              </Link>
              <Link
                href="/auth/sign-in"
                className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Sign in
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">Pain point</p>
              <p className="mt-2 text-sm text-rose-100">Leads get lost in calls, texts, and paper notes.</p>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Pain point</p>
              <p className="mt-2 text-sm text-amber-100">Quoting takes too long and pricing is inconsistent.</p>
            </div>
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Solved with TradeFlow</p>
              <p className="mt-2 text-sm text-emerald-100">
                One flow from lead to accepted quote with live conversation and share links.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-6">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-3">
            <h2 className="text-lg font-semibold text-white">Lead Capture</h2>
            <p className="mt-2 text-sm text-slate-300">
              Public tradie pages collect complete job details and feed your dashboard automatically.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-3">
            <h2 className="text-lg font-semibold text-white">AI Draft Quotes</h2>
            <p className="mt-2 text-sm text-slate-300">
              Generate structure instantly. You control line-item rates before sending.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
            <h2 className="text-base font-semibold text-white">Public Accept/Decline</h2>
            <p className="mt-2 text-sm text-slate-300">Tokenized links for fast customer response.</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
            <h2 className="text-base font-semibold text-white">Conversation Thread</h2>
            <p className="mt-2 text-sm text-slate-300">Questions stay attached to the exact quote.</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
            <h2 className="text-base font-semibold text-white">Tradie Branding</h2>
            <p className="mt-2 text-sm text-slate-300">Show testimonials, projects, services, and your brand.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to stop quote admin overload?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300">
            Create your account, verify your email, and start from your tradie profile page.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Sign up
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
