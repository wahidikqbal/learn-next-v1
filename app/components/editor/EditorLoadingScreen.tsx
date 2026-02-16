'use client';

import LoadingScreen from '@/shared/ui/feedback/LoadingScreen';

export default function EditorLoadingScreen() {
    return (
        <LoadingScreen
            eyebrow="Editor Workspace"
            title="Menyiapkan canvas Anda"
            description="Menyinkronkan komponen, properti, dan data halaman."
        >
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
        </LoadingScreen>
    );
}
