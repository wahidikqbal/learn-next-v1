import LoadingScreen from '@/shared/ui/feedback/LoadingScreen';

export default function AdminLoading() {
    return (
        <LoadingScreen
            eyebrow="Admin Panel"
            title="Menyiapkan data manajemen"
            description="Memuat daftar user, role, dan halaman untuk administrasi."
            sideAccentClassName="bg-slate-300/35"
            bottomAccentClassName="bg-blue-200/35"
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 h-4 w-28 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-9 animate-pulse rounded bg-slate-100" />
                        <div className="h-9 animate-pulse rounded bg-slate-100" />
                        <div className="h-9 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 h-4 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-9 animate-pulse rounded bg-slate-100" />
                        <div className="h-9 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            </div>
        </LoadingScreen>
    );
}
