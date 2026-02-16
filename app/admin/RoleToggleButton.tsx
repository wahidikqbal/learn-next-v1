'use client';

import { useTransition } from 'react';
import { Role } from '@prisma/client';
import { useToast } from '@/shared/ui/feedback/ToastProvider';
import type { AdminActionResult } from './action-types';

type RoleToggleButtonProps = {
    userId: string;
    currentRole: Role;
    disabled?: boolean;
    action: (formData: FormData) => Promise<AdminActionResult>;
};

export default function RoleToggleButton({
    userId,
    currentRole,
    disabled = false,
    action,
}: RoleToggleButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const nextRole = currentRole === Role.ADMIN ? Role.USER : Role.ADMIN;

    const handleClick = () => {
        if (disabled || isPending) {
            return;
        }

        const formData = new FormData();
        formData.set('userId', userId);
        formData.set('role', nextRole);

        startTransition(async () => {
            const result = await action(formData);

            if (!result.ok) {
                showToast(result.message, 'error');
                return;
            }

            showToast('Role user berhasil diperbarui.', 'success');
        });
    };

    return (
        <button
            type="button"
            disabled={disabled || isPending}
            onClick={handleClick}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {currentRole === Role.ADMIN ? 'Jadikan User' : 'Jadikan Admin'}
        </button>
    );
}
