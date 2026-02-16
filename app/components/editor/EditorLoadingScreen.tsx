'use client';

export default function EditorLoadingScreen() {
    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-slate-100 px-6">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-[-20%] h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="absolute -right-24 bottom-[-20%] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
            </div>

            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-xl backdrop-blur sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Editor Workspace</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Menyiapkan canvas Anda</h2>
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
                </div>

                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-300" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-300" />
                            <div className="h-2 w-2 rounded-full bg-amber-300" />
                            <div className="h-2 w-2 rounded-full bg-emerald-300" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                                <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">Menyinkronkan komponen, properti, dan data halaman.</p>
            </div>
        </div>
    );
}

