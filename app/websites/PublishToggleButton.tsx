'use client';

import { useState, useTransition } from 'react';
import ConfirmModal from '@/shared/ui/feedback/ConfirmModal';

type PublishToggleButtonProps = {
    pageId: string;
    pageName: string;
    isPublished: boolean;
    publishAction: (formData: FormData) => void | Promise<void>;
    unpublishAction: (formData: FormData) => void | Promise<void>;
};

export default function PublishToggleButton({
    pageId,
    pageName,
    isPublished,
    publishAction,
    unpublishAction,
}: PublishToggleButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        const formData = new FormData();
        formData.set('pageId', pageId);

        setIsOpen(false);
        startTransition(async () => {
            if (isPublished) {
                await unpublishAction(formData);
                return;
            }
            await publishAction(formData);
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isPublished
                        ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
            >
                {isPublished ? 'Unpublish' : 'Publish'}
            </button>

            <ConfirmModal
                open={isOpen}
                title={isPublished ? 'Jadikan Draft?' : 'Publish website?'}
                message={
                    isPublished
                        ? `Website "${pageName}" akan di-unpublish dan kembali jadi draft.`
                        : `Website "${pageName}" akan dipublikasikan.`
                }
                confirmLabel={isPublished ? 'Ya, Unpublish' : 'Ya, Publish'}
                confirmTone={isPublished ? 'warning' : 'success'}
                pending={isPending}
                onCancel={() => setIsOpen(false)}
                onConfirm={handleConfirm}
            />
        </>
    );
}
