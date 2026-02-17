import { ChevronRight, Home, MenuSquare } from 'lucide-react';
import { requireUser } from '@/lib/authz';
import AppSidebar from '@/shared/ui/navigation/AppSidebar';
import NavbarEditorClient from './NavbarEditorClient';

type TenantNavbarPageProps = {
    params: Promise<{ tenantId: string }>;
};

export default async function TenantNavbarPage({ params }: TenantNavbarPageProps) {
    const session = await requireUser();
    const { tenantId } = await params;
    const profileImage = session.user.image || '/default-avatar.svg';
    const profileName = session.user.name?.trim() || session.user.email?.split('@')[0] || 'User';
    const isAdmin = session.user.role === 'ADMIN';

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full">
                <AppSidebar
                    active="websites"
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
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Home size={14} />
                            <ChevronRight size={14} />
                            <span>Websites</span>
                            <ChevronRight size={14} />
                            <span className="font-semibold text-slate-800">Navbar Editor</span>
                        </div>
                        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
                            <MenuSquare size={22} />
                            Navbar Editor
                        </h1>
                        <p className="text-sm text-slate-500">Tenant ID: {tenantId}</p>
                    </div>

                    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
                        <NavbarEditorClient tenantId={tenantId} />
                    </div>
                </section>
            </div>
        </main>
    );
}

