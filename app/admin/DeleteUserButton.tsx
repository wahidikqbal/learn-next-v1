'use client';

import { useState, useTransition } from 'react';
import ConfirmModal from '@/app/components/ui/ConfirmModal';
import { useToast } from '@/app/components/ui/ToastProvider';
import type { AdminActionResult } from './action-types';

type DeleteUserButtonProps = {
    userId: string;
    userEmail: string;
    action: (formData: FormData) => Promise<AdminActionResult>;
    disabled?: boolean;
};

export default function DeleteUserButton({
    userId,
    userEmail,
    action,
    disabled = false,
}: DeleteUserButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleConfirmDelete = () => {
        const formData = new FormData();
        formData.set('userId', userId);

        setIsOpen(false);
        startTransition(async () => {
            const result = await action(formData);
            if (!result.ok) {
                showToast(result.message, 'error');
                return;
            }

            showToast('User berhasil dihapus.', 'success');
        });
    };

    if (disabled) {
        return <button type="button" disabled className="rounded-md bg-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 cursor-not-allowed">Delete</button>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
                Delete
            </button>

            <ConfirmModal
                open={isOpen}
                title="Hapus user?"
                message={
                    <>
                        User <span className="font-semibold">{userEmail}</span> akan dihapus bersama data terkait.
                    </>
                }
                confirmLabel="Ya, Hapus"
                confirmTone="danger"
                pending={isPending}
                onCancel={() => setIsOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}
