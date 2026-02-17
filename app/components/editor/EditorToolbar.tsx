import { useMemo, useState } from 'react';
import { ExternalLink, Maximize, Minus, Monitor, Plus, Smartphone, Tablet, LayoutTemplate, Upload, X } from 'lucide-react';
import { buildTenantUrl, getRootDomain } from '@/shared/config/env';

interface EditorToolbarProps {
    publishMode?: 'page' | 'custom';
    pageId?: string;
    pageName: string;
    subdomain?: string;
    templateId?: string;
    storageKey?: string;
    viewMode: 'mobile' | 'tablet' | 'desktop';
    setViewMode: (mode: 'mobile' | 'tablet' | 'desktop') => void;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    handleOpenLivePreview: () => void;
    onOpenTemplateSelector: () => void;
}

export default function EditorToolbar({
    publishMode = 'page',
    pageId,
    pageName,
    subdomain,
    templateId,
    storageKey = 'preview_blocks',
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    handleOpenLivePreview,
    onOpenTemplateSelector
}: EditorToolbarProps) {
    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [customSubdomain, setCustomSubdomain] = useState('');
    const [publishError, setPublishError] = useState<string | null>(null);

    const sanitizedSubdomain = useMemo(
        () =>
            (publishMode === 'page' ? subdomain ?? '' : customSubdomain)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, ''),
        [customSubdomain, publishMode, subdomain]
    );

    const publishUrl = sanitizedSubdomain ? buildTenantUrl(sanitizedSubdomain) : '';
    const rootDomain = getRootDomain();

    const mapPublishError = (status: number, message?: string) => {
        if (status === 409) return 'Subdomain sudah dipakai.';
        if (status === 401 || status === 403) return 'Sesi login berakhir. Silakan login lagi.';
        if (message?.trim()) return message;
        return 'Publish gagal. Coba ulang beberapa saat lagi.';
    };

    const handlePublish = async () => {
        setPublishError(null);

        if (!publishUrl) {
            setPublishError('Subdomain belum tersedia untuk halaman ini.');
            return;
        }

        setIsPublishing(true);

        try {
            let response: Response;

            if (publishMode === 'page') {
                if (!pageId) {
                    throw new Error('Page ID tidak tersedia.');
                }
                response = await fetch(`/api/pages/${pageId}/publish`, { method: 'POST' });
            } else {
                const rawBlocks = localStorage.getItem(storageKey);
                if (!rawBlocks) {
                    setPublishError('Data halaman belum tersedia. Silakan coba lagi.');
                    return;
                }

                response = await fetch('/api/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subdomain: sanitizedSubdomain,
                        blocks: JSON.parse(rawBlocks),
                        templateId: templateId ?? 'custom',
                        name: pageName,
                    }),
                });
            }

            if (!response.ok) {
                let message: string | undefined;
                try {
                    const data = (await response.json()) as { error?: string };
                    message = data.error;
                } catch {
                    message = undefined;
                }
                throw new Error(mapPublishError(response.status, message));
            }

            window.open(publishUrl, '_blank', 'noopener,noreferrer');
            setIsPublishOpen(false);
        } catch (error: unknown) {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : 'Publish gagal. Coba ulang beberapa saat lagi.';
            setPublishError(message);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <>
            <div className="bg-white px-3 py-2 shadow-sm z-10 border-b border-gray-100 lg:h-16 lg:px-6 lg:py-0 lg:flex lg:items-center lg:justify-between">
                {/* Sisi Kiri: Preview, Template, Publish */}
                <div className="w-full flex items-center gap-2 flex-wrap lg:w-1/3">
                    <span className="hidden 2xl:inline-block text-xs font-semibold text-gray-500">
                        {pageName}
                    </span>
                    <button
                        onClick={handleOpenLivePreview}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[11px] sm:text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                        title="Live Preview"
                    >
                        <ExternalLink size={14} />
                        <span>PREVIEW</span>
                    </button>

                    <button
                        onClick={onOpenTemplateSelector}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-md text-[11px] sm:text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-200"
                        title="Change Template"
                    >
                        <LayoutTemplate size={14} />
                        <span>TEMPLATE</span>
                    </button>

                    <button
                        onClick={() => {
                            setPublishError(null);
                            setIsPublishOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] sm:text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                        title="Publish Website"
                    >
                        <Upload size={14} />
                        <span>PUBLISH</span>
                    </button>
                </div>

                {/* Tengah: Device Switcher */}
                <div className="mt-2 lg:mt-0 w-full lg:w-auto flex items-center justify-center bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setViewMode('mobile'); setZoom(1); }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                        title="Mobile View"
                    >
                        <Smartphone size={18} />
                    </button>
                    <button
                        onClick={() => { setViewMode('tablet'); setZoom(1); }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                        title="Tablet View"
                    >
                        <Tablet size={18} />
                    </button>
                    <button
                        onClick={() => { setViewMode('desktop'); setZoom(0.85); }}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                        title="Desktop View"
                    >
                        <Monitor size={18} />
                    </button>
                </div>

                {/* Kanan: Zoom Controls */}
                <div className="mt-2 lg:mt-0 w-full lg:w-1/3 flex justify-center lg:justify-end items-center gap-2">
                    <div className="flex items-center bg-gray-50 border rounded-lg p-1">
                        <button
                            onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
                        >
                            <Minus size={14} />
                        </button>

                        <span className="text-[11px] font-bold w-12 text-center text-gray-600">
                            {Math.round(zoom * 100)}%
                        </span>

                        <button
                            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <button
                        onClick={() => setZoom(1)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Reset to 100%"
                    >
                        <Maximize size={18} />
                    </button>
                </div>
            </div>

            {isPublishOpen && (
                <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold text-gray-900">
                                Publish Website
                            </h2>
                            <button
                                onClick={() => setIsPublishOpen(false)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-3">
                            <label className="text-sm text-gray-700 font-medium block">
                                Subdomain halaman
                            </label>
                            <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                                {publishMode === 'page' ? (
                                    <div className="flex-1 px-3 py-2.5 text-sm text-gray-800 bg-white">
                                        {sanitizedSubdomain}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={customSubdomain}
                                        onChange={(e) => setCustomSubdomain(e.target.value)}
                                        placeholder="contoh: toko-online"
                                        className="flex-1 px-3 py-2.5 text-sm outline-none"
                                    />
                                )}
                                <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border-l border-gray-200">
                                    .{rootDomain}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500">
                                URL publish: {publishUrl || buildTenantUrl('subdomain')}
                            </p>

                            {publishError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {publishError}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setPublishError(null);
                                    setIsPublishOpen(false);
                                }}
                                className="px-3 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={!publishUrl || isPublishing}
                                className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                            >
                                {isPublishing ? 'Publishing...' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
