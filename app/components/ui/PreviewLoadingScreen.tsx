'use client';

import LoadingScreen from '@/app/components/ui/LoadingScreen';

export default function PreviewLoadingScreen() {
    return (
        <LoadingScreen
            eyebrow="Live Preview"
            title="Menyinkronkan preview"
            description="Memuat blok terbaru agar preview tetap real-time."
            sideAccentClassName="bg-emerald-200/40"
            bottomAccentClassName="bg-sky-200/40"
        >
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-300" />
                    <div className="h-2 w-2 rounded-full bg-amber-300" />
                    <div className="h-2 w-2 rounded-full bg-emerald-300" />
                </div>
                <div className="space-y-3">
                    <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                </div>
            </div>
        </LoadingScreen>
    );
}

