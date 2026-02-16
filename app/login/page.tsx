import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { auth, signIn } from '@/auth';

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

export default async function LoginPage() {
    const session = await auth();

    if (session?.user) {
        return (
            <main className={`${plusJakarta.className} relative min-h-screen overflow-hidden bg-[#f6f8fb] px-4 py-8 sm:py-10`}>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
                    <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
                </div>
                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
                    <div className="w-full rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:p-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">learn-next</p>
                        <h1 className="mt-4 text-2xl font-bold text-slate-900">Anda sudah login</h1>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Akun Anda sudah aktif. Lanjutkan ke panel untuk mulai mengelola halaman.
                        </p>
                        <div className="mt-7">
                            <Link
                                href={session.user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Buka Panel
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={`${plusJakarta.className} relative min-h-screen overflow-hidden bg-[#f6f8fb] px-4 py-8 sm:py-10`}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-100/35 blur-3xl" />
                <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
            </div>

            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden lg:block">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">learn-next</p>
                    <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight text-slate-900">
                        Satu klik untuk masuk dan mulai publish.
                    </h1>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                        Kami hanya menggunakan Google Sign-In. Tidak ada form email/password, jadi prosesnya lebih
                        cepat dan tetap aman.
                    </p>
                </section>

                <section className="w-full max-w-md justify-self-center rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:p-10">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">learn-next</p>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">Masuk ke akun Anda</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Lanjutkan dengan akun Google untuk membuka dashboard Anda.
                        </p>
                    </div>

                    <form
                        className="mt-8"
                        action={async () => {
                            'use server';
                            await signIn('google', { redirectTo: '/dashboard' });
                        }}
                    >
                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fill="#EA4335"
                                    d="M12 10.2v4.2h5.9c-.3 1.4-1.8 4.1-5.9 4.1-3.5 0-6.4-2.9-6.4-6.5s2.9-6.5 6.4-6.5c2 0 3.3.8 4.1 1.6l2.8-2.7C17.2 2.8 14.9 2 12 2 6.9 2 2.8 6.2 2.8 11.3S6.9 20.6 12 20.6c6.9 0 9.2-4.9 9.2-7.4 0-.5 0-.9-.1-1.3H12Z"
                                />
                            </svg>
                            Lanjutkan dengan Google
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
                        Dengan lanjut, Anda menyetujui proses autentikasi via Google tanpa email/password lokal.
                    </p>
                </section>
            </div>
        </main>
    );
}
