'use client';

import { useState, useTransition } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Eye, MoreVertical, Rocket, Trash2 } from 'lucide-react';
import ConfirmModal from '@/shared/ui/feedback/ConfirmModal';
import { useToast } from '@/shared/ui/feedback/ToastProvider';

type WebsiteCardMenuProps = {
    pageId: string;
    pageName: string;
    previewUrl: string;
    isPublished: boolean;
    publishAction: (formData: FormData) => void | Promise<void>;
    unpublishAction: (formData: FormData) => void | Promise<void>;
    deleteAction: (formData: FormData) => void | Promise<void>;
    showStatusActions?: boolean;
};

type ConfirmType = 'publish' | 'unpublish' | 'delete' | null;

export default function WebsiteCardMenu({
    pageId,
    pageName,
    previewUrl,
    isPublished,
    publishAction,
    unpublishAction,
    deleteAction,
    showStatusActions = true,
}: WebsiteCardMenuProps) {
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<ConfirmType>(null);
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    useEffect(() => {
        const handleExternalMenuOpen = (event: Event) => {
            const customEvent = event as CustomEvent<{ id?: string }>;
            if (customEvent.detail?.id !== menuId) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('website-card-menu-open', handleExternalMenuOpen as EventListener);
        return () => {
            window.removeEventListener('website-card-menu-open', handleExternalMenuOpen as EventListener);
        };
    }, [menuId]);

    useEffect(() => {
        if (!isMenuOpen) return;
        window.dispatchEvent(
            new CustomEvent('website-card-menu-open', { detail: { id: menuId } })
        );
    }, [isMenuOpen, menuId]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (!rootRef.current) return;
            const target = event.target as Node | null;
            if (target && !rootRef.current.contains(target)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsMenuOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen((prev) => !prev);

    const openConfirm = (type: Exclude<ConfirmType, null>) => {
        setIsMenuOpen(false);
        setConfirmType(type);
    };

    const closeConfirm = () => setConfirmType(null);

    const handleConfirmAction = () => {
        if (!confirmConfig) return;
        const actionType = confirmType;
        const formData = new FormData();
        formData.set('pageId', pageId);

        // Close UI first so modal always disappears immediately.
        setConfirmType(null);
        setIsMenuOpen(false);

        startTransition(async () => {
            try {
                await confirmConfig.action(formData);

                if (actionType === 'publish') {
                    showToast('Website berhasil dipublish.', 'success');
                    return;
                }

                if (actionType === 'unpublish') {
                    showToast('Website berhasil dijadikan draft.', 'success');
                    return;
                }

                showToast('Website berhasil dihapus.', 'success');
            } catch {
                showToast('Aksi gagal diproses. Coba lagi.', 'error');
            }
        });
    };

    const confirmConfig =
        confirmType === 'publish'
            ? {
                title: 'Publish website?',
                message: `Website "${pageName}" akan dipublikasikan.`,
                buttonLabel: 'Ya, Publish',
                action: publishAction,
            }
            : confirmType === 'unpublish'
                ? {
                    title: 'Jadikan Draft?',
                    message: `Website "${pageName}" akan di-unpublish dan kembali jadi draft.`,
                    buttonLabel: 'Ya, Unpublish',
                    action: unpublishAction,
                }
                : confirmType === 'delete'
                    ? {
                        title: 'Hapus website?',
                        message: `Website "${pageName}" akan dihapus permanen.`,
                        buttonLabel: 'Ya, Hapus',
                        action: deleteAction,
                    }
                    : null;

    return (
        <>
            <div ref={rootRef} className="relative">
                <button
                    type="button"
                    onClick={toggleMenu}
                    className={`group relative inline-flex items-center justify-center rounded-lg border p-2 text-slate-600 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                        isMenuOpen
                            ? 'border-blue-200 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-700 hover:shadow'
                    }`}
                    title="Menu aksi"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                >
                    <MoreVertical size={16} className="transition-transform duration-200 group-hover:scale-110" />
                    {!isMenuOpen && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500/90 ring-2 ring-white" />
                    )}
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <Eye size={15} />
                                Preview
                            </a>

                            {showStatusActions && (
                                isPublished ? (
                                    <button
                                        type="button"
                                        onClick={() => openConfirm('unpublish')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <Rocket size={15} />
                                        Unpublish
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => openConfirm('publish')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        <Rocket size={15} />
                                        Publish
                                    </button>
                                )
                            )}

                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                onClick={() => openConfirm('delete')}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={15} />
                                Delete
                            </button>
                    </div>
                )}
            </div>
            <ConfirmModal
                open={!!confirmConfig}
                title={confirmConfig?.title ?? ''}
                message={confirmConfig?.message ?? ''}
                confirmLabel={confirmConfig?.buttonLabel ?? ''}
                confirmTone={
                    confirmType === 'publish'
                        ? 'success'
                        : confirmType === 'unpublish'
                            ? 'warning'
                            : 'danger'
                }
                pending={isPending}
                onCancel={closeConfirm}
                onConfirm={handleConfirmAction}
            />
        </>
    );
}
