import Link from 'next/link';
import { auth } from '@/auth';

export default async function WelcomeComponent() {
    const session = await auth();
    const primaryHref = session?.user ? '/dashboard' : '/login';
    const primaryLabel = session?.user ? 'Buka Dashboard' : 'Login dengan Google';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-blue-500 to-purple-600">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-white mb-4">
                    SaaS Page Builder
                </h1>
                <p className="text-xl text-gray-100 mb-8">
                    Login, pilih template, tentukan subdomain, lalu publish.
                </p>
                <div className="flex items-center justify-center gap-2">
                    <Link
                        href={primaryHref}
                        className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                    >
                        {primaryLabel}
                    </Link>
                    <Link
                        href="/templates"
                        className="rounded-lg border border-white/60 px-4 py-2 font-semibold text-white hover:bg-white/10"
                    >
                        Lihat Template
                    </Link>
                </div>
            </div>
        </div>
    );
}
