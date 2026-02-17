'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type { Block } from '@/app/components/editor/types/editor';
import { schemaMap } from '@/app/components/editor/schemas/schema';
import type { Template } from '@/app/components/templates/types';
import EditorSidebar from '@/app/components/editor/EditorSidebar';
import EditorToolbar from '@/app/components/editor/EditorToolbar';
import EditorCanvas from '@/app/components/editor/EditorCanvas';
import ResetModal from '@/app/components/editor/ResetModal';
import EditorLoadingScreen from '@/app/components/editor/EditorLoadingScreen';
import TemplateSelector from '@/app/components/templates/TemplateSelector';

type EditorPropValue = string | number | boolean;
type EditorProps = Record<string, EditorPropValue>;

type PageResponse = {
    page: {
        id: string;
        name: string;
        slug?: string;
        subdomain: string;
        blocks: Block[];
    };
};

const INITIAL_BLOCKS: Block[] = [
    { id: 'hero', type: 'hero', props: { heading: 'Loading...', subheading: '', align: 'center' } },
];

export default function EditByPageId() {
    const params = useParams<{ pageId: string }>();
    const router = useRouter();
    const pageId = params.pageId;

    const [pageName, setPageName] = useState('Halaman');
    const [pageSlug, setPageSlug] = useState('/');
    const [subdomain, setSubdomain] = useState('');
    const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [zoom, setZoom] = useState(1);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [isMobileSidebarMounted, setIsMobileSidebarMounted] = useState(false);
    const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(false);
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; blockId: string | null }>({
        isOpen: false,
        blockId: null,
    });

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const metadataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialSyncRef = useRef(true);
    const isInitialMetadataSyncRef = useRef(true);
    const closeDrawerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swipeStartXRef = useRef(0);
    const swipeCurrentXRef = useRef(0);
    const [metadataSaveState, setMetadataSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const normalizeSlugInput = useCallback((value: string) => {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed || trimmed === '/') return '/';

        const rawSegments = trimmed.replace(/^\/+/, '').split('/');
        const segments = rawSegments
            .map((segment) =>
                segment
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
            )
            .filter(Boolean);

        if (segments.length === 0) return '/';
        return `/${segments.join('/')}`;
    }, []);

    const persistPagePatch = useCallback(
        async (payload: { blocks?: Block[]; name?: string; slug?: string }) => {
            const response = await fetch(`/api/pages/${pageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to persist page changes.');
            }

            return (await response.json()) as PageResponse;
        },
        [pageId]
    );

    const persistBlocks = useCallback(
        async (nextBlocks: Block[]) => {
            await persistPagePatch({ blocks: nextBlocks });
        },
        [persistPagePatch]
    );

    useEffect(() => {
        const loadPage = async () => {
            const response = await fetch(`/api/pages/${pageId}`);

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                router.replace('/dashboard');
                return;
            }

            const data = (await response.json()) as PageResponse;
            setPageName(data.page.name);
            setPageSlug(data.page.slug ?? '/');
            setSubdomain(data.page.subdomain);
            setBlocks(data.page.blocks);
            setIsLoaded(true);
        };

        void loadPage();
    }, [pageId, router]);

    useEffect(() => {
        if (!isLoaded) return;

        localStorage.setItem(`preview_blocks_${pageId}`, JSON.stringify(blocks));

        if (isInitialSyncRef.current) {
            isInitialSyncRef.current = false;
            return;
        }

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            void persistBlocks(blocks);
        }, 500);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [blocks, isLoaded, pageId, persistBlocks]);

    useEffect(() => {
        if (!isLoaded) return;

        if (isInitialMetadataSyncRef.current) {
            isInitialMetadataSyncRef.current = false;
            return;
        }

        if (metadataTimerRef.current) {
            clearTimeout(metadataTimerRef.current);
        }

        setMetadataSaveState('saving');

        metadataTimerRef.current = setTimeout(() => {
            void (async () => {
                try {
                    const data = await persistPagePatch({
                        name: pageName,
                        slug: pageSlug,
                    });
                    setPageName(data.page.name);
                    setPageSlug(data.page.slug ?? pageSlug);
                    setMetadataSaveState('saved');
                } catch {
                    setMetadataSaveState('error');
                }
            })();
        }, 700);

        return () => {
            if (metadataTimerRef.current) {
                clearTimeout(metadataTimerRef.current);
            }
        };
    }, [isLoaded, pageName, pageSlug, persistPagePatch]);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
            if (event.matches) {
                setIsMobileSidebarVisible(false);
                setIsMobileSidebarMounted(false);
                setIsCanvasFullscreen(false);
            } else {
                // Small screens start collapsed for faster navigation.
                setOpenId(null);
            }
        };

        handleChange(media);
        media.addEventListener('change', handleChange);

        return () => {
            media.removeEventListener('change', handleChange);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (closeDrawerTimerRef.current) {
                clearTimeout(closeDrawerTimerRef.current);
            }
            if (metadataTimerRef.current) {
                clearTimeout(metadataTimerRef.current);
            }
        };
    }, []);

    const openMobileDrawer = useCallback(() => {
        if (closeDrawerTimerRef.current) {
            clearTimeout(closeDrawerTimerRef.current);
        }
        setIsMobileSidebarMounted(true);
        // Run on next frame to trigger CSS transition.
        requestAnimationFrame(() => setIsMobileSidebarVisible(true));
    }, []);

    const closeMobileDrawer = useCallback(() => {
        setIsMobileSidebarVisible(false);
        if (closeDrawerTimerRef.current) {
            clearTimeout(closeDrawerTimerRef.current);
        }
        closeDrawerTimerRef.current = setTimeout(() => {
            setIsMobileSidebarMounted(false);
            setOpenId(null);
        }, 220);
    }, []);

    const handleDrawerTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
        swipeStartXRef.current = event.touches[0]?.clientX ?? 0;
        swipeCurrentXRef.current = swipeStartXRef.current;
    }, []);

    const handleDrawerTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
        swipeCurrentXRef.current = event.touches[0]?.clientX ?? swipeCurrentXRef.current;
    }, []);

    const handleDrawerTouchEnd = useCallback(() => {
        const deltaX = swipeCurrentXRef.current - swipeStartXRef.current;
        if (deltaX < -60) {
            closeMobileDrawer();
        }
    }, [closeMobileDrawer]);

    const handleUpdateProps = useCallback((id: string, newProps: EditorProps) => {
        setBlocks((prev) =>
            prev.map((block) =>
                block.id === id
                    ? { ...block, props: { ...block.props, ...newProps } }
                    : block
            )
        );
    }, []);

    const toggleVisibility = useCallback((id: string) => {
        setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, hidden: !block.hidden } : block)));
    }, []);

    const handleLoadTemplate = useCallback((template: Template) => {
        setBlocks(template.blocks.map((block) => ({ ...block })));
        setShowTemplateSelector(false);
    }, []);

    const confirmReset = useCallback(() => {
        const id = resetModal.blockId;
        if (!id) return;

        const block = blocks.find((item) => item.id === id);
        if (!block) return;

        const schema = schemaMap[block.type];
        const defaultProps: EditorProps = {};
        Object.entries(schema).forEach(([key, field]) => {
            defaultProps[key] = field.defaultValue;
        });

        handleUpdateProps(id, defaultProps);
        setResetModal({ isOpen: false, blockId: null });
    }, [blocks, handleUpdateProps, resetModal.blockId]);

    const handleOpenDraftPreview = useCallback(async () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        if (metadataTimerRef.current) {
            clearTimeout(metadataTimerRef.current);
            metadataTimerRef.current = null;
        }

        try {
            await persistPagePatch({
                blocks,
                name: pageName,
                slug: pageSlug,
            });
        } catch {
            // Ignore save errors here, preview will still open with latest persisted state.
        }

        try {
            const response = await fetch('/api/preview-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId }),
            });

                if (response.ok) {
                    const data = (await response.json()) as { previewUrl?: string; expiresAt?: string };
                    if (typeof data.previewUrl === 'string' && data.previewUrl) {
                        const previewUrl = new URL(data.previewUrl, window.location.origin);
                        if (typeof data.expiresAt === 'string' && data.expiresAt) {
                            previewUrl.searchParams.set('expiresAt', data.expiresAt);
                        }
                        window.open(previewUrl.toString(), '_blank');
                        return;
                    }
                }
        } catch {
            // Ignore token generation errors and fallback to protected preview route.
        }

        window.open(`/preview/${pageId}`, '_blank');
    }, [blocks, pageId, pageName, pageSlug, persistPagePatch]);

    if (!isLoaded) {
        return <EditorLoadingScreen />;
    }

    return (
        <div className="flex h-[100dvh] flex-col lg:flex-row bg-white overflow-hidden">
            <EditorSidebar
                blocks={blocks}
                openId={openId}
                setOpenId={setOpenId}
                toggleVisibility={toggleVisibility}
                triggerReset={(id) => setResetModal({ isOpen: true, blockId: id })}
                handleUpdateProps={handleUpdateProps}
                schemaMap={schemaMap}
                className="hidden lg:flex"
            />

            {isMobileSidebarMounted && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isMobileSidebarVisible ? 'opacity-100' : 'opacity-0'}`}
                        onClick={closeMobileDrawer}
                    />
                    <div
                        className={`absolute left-0 top-0 h-full w-[88vw] max-w-sm bg-white shadow-xl transition-transform duration-200 ease-out ${isMobileSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}
                        onTouchStart={handleDrawerTouchStart}
                        onTouchMove={handleDrawerTouchMove}
                        onTouchEnd={handleDrawerTouchEnd}
                    >
                        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
                            <p className="text-sm font-semibold text-gray-800">Sections</p>
                            <button
                                type="button"
                                onClick={closeMobileDrawer}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                        </div>
                        <EditorSidebar
                            blocks={blocks}
                            openId={openId}
                            setOpenId={setOpenId}
                            toggleVisibility={toggleVisibility}
                            triggerReset={(id) => setResetModal({ isOpen: true, blockId: id })}
                            handleUpdateProps={handleUpdateProps}
                            schemaMap={schemaMap}
                            className="h-[calc(100%-3rem)] max-h-full border-r border-b-0"
                        />
                    </div>
                </div>
            )}

            <main className="flex-1 min-h-0 flex flex-col bg-[#f3f4f6]">
                <div className={`${isCanvasFullscreen ? 'hidden lg:flex' : 'flex'} items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-4 sm:py-2.5`}>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            <ArrowLeft size={14} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <Link
                            href="/websites"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                            <Globe size={14} />
                            <span className="hidden sm:inline">Websites</span>
                        </Link>
                    </div>
                    <p className="max-w-[220px] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Edit: {pageName}
                    </p>
                </div>
                <div className={`${isCanvasFullscreen ? 'hidden lg:block' : 'block'}`}>
                    <div className="border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
                            <input
                                value={pageName}
                                onChange={(event) => setPageName(event.target.value)}
                                placeholder="Nama halaman"
                                className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                value={pageSlug}
                                onChange={(event) => setPageSlug(normalizeSlugInput(event.target.value))}
                                placeholder="/about"
                                className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="text-xs font-medium text-slate-500">
                                {metadataSaveState === 'saving' && 'Menyimpan metadata...'}
                                {metadataSaveState === 'saved' && 'Metadata tersimpan'}
                                {metadataSaveState === 'error' && 'Gagal simpan metadata'}
                                {metadataSaveState === 'idle' && 'Metadata halaman'}
                            </p>
                        </div>
                    </div>
                    <EditorToolbar
                        pageId={pageId}
                        pageName={pageName}
                        subdomain={subdomain}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        zoom={zoom}
                        setZoom={setZoom}
                        handleOpenLivePreview={handleOpenDraftPreview}
                        onOpenTemplateSelector={() => setShowTemplateSelector(true)}
                    />
                </div>

                <div className={`${isCanvasFullscreen ? 'hidden' : 'flex'} lg:hidden border-b border-gray-200 bg-white px-3 py-2 items-center gap-2`}>
                    <button
                        type="button"
                        onClick={openMobileDrawer}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Sections
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCanvasFullscreen(true)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Fullscreen
                    </button>
                </div>

                <EditorCanvas
                    blocks={blocks}
                    viewMode={viewMode}
                    zoom={zoom}
                    schemaMap={schemaMap}
                    isFullscreen={isCanvasFullscreen}
                />

                {isCanvasFullscreen && (
                    <button
                        type="button"
                        onClick={() => setIsCanvasFullscreen(false)}
                        className="fixed bottom-4 right-4 z-30 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-lg lg:hidden"
                    >
                        Keluar Fullscreen
                    </button>
                )}
            </main>

            <ResetModal
                isOpen={resetModal.isOpen}
                onClose={() => setResetModal({ isOpen: false, blockId: null })}
                onConfirm={confirmReset}
            />

            <TemplateSelector
                isOpen={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelect={handleLoadTemplate}
            />
        </div>
    );
}
