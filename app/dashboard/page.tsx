import Link from 'next/link';
import {
    Home,
    ChevronRight,
    EyeIcon,
} from 'lucide-react';
import { requireUser } from '@/lib/authz';
import { createPageAction } from './actions';
import CreatePageForm from './CreatePageForm';
import AppSidebar from '@/shared/ui/navigation/AppSidebar';

type DashboardPageProps = {
    searchParams: Promise<{
        error?: string;
        templateId?: string;
    }>;
};

function mapError(error?: string) {
    if (error === 'subdomain-conflict') return 'Subdomain sudah dipakai.';
    if (error === 'template-not-found') return 'Template tidak ditemukan.';
    if (error === 'invalid-create') return 'Data create page tidak valid.';
    if (error === 'create-failed') return 'Gagal membuat halaman. Silakan coba lagi.';
    return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const session = await requireUser();
    const params = await searchParams;
    const profileImage = session.user.image || '/default-avatar.svg';
    const profileName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';
    const errorMessage = mapError(params.error);
    const isAdmin = session.user.role === 'ADMIN';

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full">
                <AppSidebar
                    active="dashboard"
                    user={{
                        name: profileName,
                        email: session.user.email ?? '',
                        image: profileImage,
                    }}
                    isAdmin={isAdmin}
                    footerLink={{ href: '/websites', label: 'Websites' }}
                />

                <section className="flex-1">
                    <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-10">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <Home size={14} />
                                    <ChevronRight size={14} />
                                    <span>Dashboard</span>
                                    <ChevronRight size={14} />
                                    <span className="font-semibold text-slate-800">Create Website</span>
                                </div>
                                <h1 className="mt-2 text-2xl font-bold text-slate-900">Buat Website Baru</h1>
                                <p className="text-sm text-slate-500">Mulai dari template, pilih subdomain, lalu lanjut edit.</p>
                            </div>
                            <Link
                                href="/websites"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                <EyeIcon size={16} />
                                Lihat Semua Website
                            </Link>
                        </div>
                    </div>

                    <div className="px-4 py-6 sm:px-6 lg:px-10 max-w-7xl mx-auto">
                        <section id="create-website" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            {errorMessage && (
                                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errorMessage}
                                </p>
                            )}
                            <CreatePageForm action={createPageAction} initialTemplateId={params.templateId} />
                        </section>
                    </div>
                </section>
            </div>
        </main>
    );
}
