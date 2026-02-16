'use client';

import type { ReactNode } from 'react';

type LoadingScreenProps = {
    eyebrow?: string;
    title?: string;
    description?: string;
    sideAccentClassName?: string;
    bottomAccentClassName?: string;
    children?: ReactNode;
};

export default function LoadingScreen({
    eyebrow = 'Loading',
    title = 'Menyiapkan halaman',
    description = 'Mohon tunggu sebentar.',
    sideAccentClassName = 'bg-blue-200/40',
    bottomAccentClassName = 'bg-cyan-200/40',
    children,
}: LoadingScreenProps) {
    return (
        <div className="relative flex h-screen items-center justify-center overflow-hidden bg-slate-100 px-6">
            <div className="pointer-events-none absolute inset-0">
                <div
                    className={`absolute -left-24 top-[-20%] h-72 w-72 rounded-full blur-3xl ${sideAccentClassName}`}
                />
                <div
                    className={`absolute -right-24 bottom-[-20%] h-72 w-72 rounded-full blur-3xl ${bottomAccentClassName}`}
                />
            </div>

            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-xl backdrop-blur sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
                </div>

                {children}

                <p className="mt-4 text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
}
