import Link from "next/link";

export default function ServerPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10 text-slate-100 sm:px-6">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Server Route</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">FastKanban server page</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          This route is kept as a protected server-rendered page. The active Kanban app lives at
          the home route.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl border border-teal-300/40 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-100 hover:bg-teal-400/20"
        >
          Back to board
        </Link>
      </section>
    </main>
  );
}
