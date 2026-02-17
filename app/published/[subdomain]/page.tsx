import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import PageRenderer from '@/app/components/PageRenderer';
import { schemaMap } from '@/app/components/editor/schemaMap';
import { getPublishedPage } from '@/lib/pages';
import { getRootDomain } from '@/shared/config/env';

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

type PublishedPageProps = {
    params: Promise<{ subdomain: string }>;
};

export default async function PublishedPage({ params }: PublishedPageProps) {
    const { subdomain } = await params;
    const rootDomain = getRootDomain();
    const site = await getPublishedPage(subdomain);

    if (!site) {
        return (
            <main className={`${plusJakarta.className} relative min-h-screen overflow-hidden bg-[#f6f8fb] px-4 py-8 sm:py-10`}>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
                    <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-100/35 blur-3xl" />
                    <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
                </div>

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
                    <section className="w-full rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:p-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">learn-next</p>
                        <h1 className="mt-4 text-2xl font-bold text-slate-900">Halaman Belum Dipublish</h1>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Subdomain <span className="font-semibold">{subdomain}.{rootDomain}</span> belum memiliki data publish.
                        </p>

                        <div className="mt-7">
                            <Link
                                href="/" 
                                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <PageRenderer blocks={site.blocks} schemaMap={schemaMap} />
        </main>
    );
}
