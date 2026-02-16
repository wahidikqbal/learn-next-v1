import LoadingScreen from '@/app/components/ui/LoadingScreen';

export default function DashboardLoading() {
    return (
        <LoadingScreen
            eyebrow="Dashboard"
            title="Menyiapkan halaman pembuatan website"
            description="Mengambil profil, template, dan pengaturan workspace."
            sideAccentClassName="bg-blue-200/40"
            bottomAccentClassName="bg-indigo-200/35"
        >
            <div className="grid gap-4">
                <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                </div>
            </div>
        </LoadingScreen>
    );
}

