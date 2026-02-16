import LoadingScreen from '@/app/components/ui/LoadingScreen';

export default function WebsitesLoading() {
    return (
        <LoadingScreen
            eyebrow="Websites"
            title="Memuat katalog website Anda"
            description="Menyiapkan statistik, filter, dan daftar website terbaru."
            sideAccentClassName="bg-cyan-200/40"
            bottomAccentClassName="bg-emerald-200/35"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
                </div>
            </div>
        </LoadingScreen>
    );
}

