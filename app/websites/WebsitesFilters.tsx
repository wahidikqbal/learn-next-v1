'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SearchField from '@/app/components/ui/SearchField';

type WebsitesFiltersProps = {
    initialQuery: string;
    initialStatus: string;
};

export default function WebsitesFilters({
    initialQuery,
    initialStatus,
}: WebsitesFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialStatus);

    const targetQueryString = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());

        const trimmedQuery = query.trim();
        if (trimmedQuery) params.set('q', trimmedQuery);
        else params.delete('q');

        if (status && status !== 'all') params.set('status', status);
        else params.delete('status');

        params.delete('sort');

        return params.toString();
    }, [query, searchParams, status]);

    useEffect(() => {
        const currentQueryString = searchParams.toString();
        if (targetQueryString === currentQueryString) return;

        const timeout = setTimeout(() => {
            const nextUrl = targetQueryString ? `${pathname}?${targetQueryString}` : pathname;
            router.replace(nextUrl, { scroll: false });
        }, 250);

        return () => clearTimeout(timeout);
    }, [pathname, router, searchParams, targetQueryString]);

    return (
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <SearchField
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
                placeholder="Cari website, subdomain, atau template..."
            />

            <select
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
                <option value="all">Semua Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
            </select>
        </div>
    );
}
