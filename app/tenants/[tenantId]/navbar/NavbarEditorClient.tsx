'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NavbarMenuChild, NavbarMenuItem } from '@/features/navbar/services/laravel-navbar.service';

type NavbarEditorClientProps = {
    tenantId: string;
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function newId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const ITEM_TYPES: Array<NavbarMenuItem['type']> = ['link', 'dropdown', 'mega_menu'];

export default function NavbarEditorClient({ tenantId }: NavbarEditorClientProps) {
    const [loadState, setLoadState] = useState<LoadState>('idle');
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [publishState, setPublishState] = useState<SaveState>('idle');
    const [items, setItems] = useState<NavbarMenuItem[]>([]);
    const [versionNo, setVersionNo] = useState<number>(0);
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [errorText, setErrorText] = useState<string | null>(null);

    const hasItems = items.length > 0;

    useEffect(() => {
        const load = async () => {
            setLoadState('loading');
            setErrorText(null);

            try {
                const response = await fetch(`/api/tenants/${tenantId}/navbar`);
                const body = (await response.json()) as {
                    navbar?: { items: NavbarMenuItem[]; status: 'draft' | 'published'; versionNo: number };
                    error?: string;
                };

                if (!response.ok || !body.navbar) {
                    throw new Error(body.error || 'Gagal memuat navbar tenant.');
                }

                setItems(body.navbar.items ?? []);
                setStatus(body.navbar.status);
                setVersionNo(body.navbar.versionNo);
                setLoadState('ready');
            } catch (error) {
                setLoadState('error');
                setErrorText(error instanceof Error ? error.message : 'Gagal memuat navbar tenant.');
            }
        };

        void load();
    }, [tenantId]);

    const statsText = useMemo(() => {
        const childrenCount = items.reduce((acc, item) => acc + (item.items?.length ?? 0), 0);
        return `${items.length} menu utama, ${childrenCount} menu child`;
    }, [items]);

    const upsertItem = (id: string, patch: Partial<NavbarMenuItem>) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: newId('menu'),
                label: 'Menu Baru',
                type: 'link',
                href: '/',
                hidden: false,
                items: [],
            },
        ]);
    };

    const addChild = (itemId: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        items: [
                            ...(item.items ?? []),
                            { id: newId('child'), label: 'Child Menu', href: '/', hidden: false },
                        ],
                    }
                    : item
            )
        );
    };

    const upsertChild = (itemId: string, childId: string, patch: Partial<NavbarMenuChild>) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id !== itemId
                    ? item
                    : {
                        ...item,
                        items: (item.items ?? []).map((child) =>
                            child.id === childId ? { ...child, ...patch } : child
                        ),
                    }
            )
        );
    };

    const removeChild = (itemId: string, childId: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id !== itemId
                    ? item
                    : {
                        ...item,
                        items: (item.items ?? []).filter((child) => child.id !== childId),
                    }
            )
        );
    };

    const saveDraft = async () => {
        setSaveState('saving');
        setErrorText(null);

        try {
            const response = await fetch(`/api/tenants/${tenantId}/navbar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const body = (await response.json()) as {
                navbar?: { items: NavbarMenuItem[]; status: 'draft' | 'published'; versionNo: number };
                error?: string;
            };

            if (!response.ok || !body.navbar) {
                throw new Error(body.error || 'Gagal menyimpan draft navbar.');
            }

            setItems(body.navbar.items ?? []);
            setStatus(body.navbar.status);
            setVersionNo(body.navbar.versionNo);
            setSaveState('saved');
        } catch (error) {
            setSaveState('error');
            setErrorText(error instanceof Error ? error.message : 'Gagal menyimpan draft navbar.');
        }
    };

    const publish = async () => {
        setPublishState('saving');
        setErrorText(null);

        try {
            const response = await fetch(`/api/tenants/${tenantId}/navbar/publish`, {
                method: 'POST',
            });
            const body = (await response.json()) as {
                navbar?: { items: NavbarMenuItem[]; status: 'draft' | 'published'; versionNo: number };
                error?: string;
            };

            if (!response.ok || !body.navbar) {
                throw new Error(body.error || 'Gagal publish navbar.');
            }

            setItems(body.navbar.items ?? []);
            setStatus(body.navbar.status);
            setVersionNo(body.navbar.versionNo);
            setPublishState('saved');
        } catch (error) {
            setPublishState('error');
            setErrorText(error instanceof Error ? error.message : 'Gagal publish navbar.');
        }
    };

    if (loadState === 'loading' || loadState === 'idle') {
        return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Memuat navbar...</p>;
    }

    if (loadState === 'error') {
        return <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{errorText ?? 'Terjadi error.'}</p>;
    }

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Status: {status.toUpperCase()}</p>
                        <p className="text-xs text-slate-500">Version: {versionNo} - {statsText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={addItem}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Add Menu
                        </button>
                        <button
                            type="button"
                            onClick={saveDraft}
                            disabled={saveState === 'saving'}
                            className="rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {saveState === 'saving' ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            type="button"
                            onClick={publish}
                            disabled={publishState === 'saving' || !hasItems}
                            className="rounded-lg border border-emerald-200 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {publishState === 'saving' ? 'Publishing...' : 'Publish Navbar'}
                        </button>
                    </div>
                </div>
                {errorText && <p className="mt-3 text-sm text-rose-600">{errorText}</p>}
            </section>

            <section className="space-y-3">
                {items.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        Navbar belum memiliki item.
                    </div>
                ) : (
                    items.map((item) => (
                        <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-2 md:grid-cols-2">
                                <input
                                    value={item.label}
                                    onChange={(event) => upsertItem(item.id, { label: event.target.value })}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Label menu"
                                />
                                <select
                                    value={item.type}
                                    onChange={(event) => {
                                        const type = event.target.value as NavbarMenuItem['type'];
                                        upsertItem(item.id, {
                                            type,
                                            href: type === 'link' ? (item.href || '/') : null,
                                            items: type === 'link' ? [] : (item.items ?? []),
                                        });
                                    }}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                                >
                                    {ITEM_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {item.type === 'link' ? (
                                <input
                                    value={item.href ?? ''}
                                    onChange={(event) => upsertItem(item.id, { href: event.target.value })}
                                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="/target-link"
                                />
                            ) : (
                                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Child Items</p>
                                        <button
                                            type="button"
                                            onClick={() => addChild(item.id)}
                                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
                                        >
                                            Add Child
                                        </button>
                                    </div>

                                    {(item.items ?? []).length === 0 ? (
                                        <p className="text-xs text-slate-500">Belum ada child menu.</p>
                                    ) : (
                                        (item.items ?? []).map((child) => (
                                            <div key={child.id} className="grid gap-2 md:grid-cols-3">
                                                <input
                                                    value={child.label}
                                                    onChange={(event) => upsertChild(item.id, child.id, { label: event.target.value })}
                                                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                                    placeholder="Child label"
                                                />
                                                <input
                                                    value={child.href}
                                                    onChange={(event) => upsertChild(item.id, child.id, { href: event.target.value })}
                                                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                                    placeholder="/child-link"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeChild(item.id, child.id)}
                                                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                                                >
                                                    Remove Child
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={!!item.hidden}
                                        onChange={(event) => upsertItem(item.id, { hidden: event.target.checked })}
                                    />
                                    Hidden
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                                >
                                    Remove Menu
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </section>
        </div>
    );
}

