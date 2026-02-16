'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ConfirmModalProps = {
    open: boolean;
    title: string;
    message: ReactNode;
    confirmLabel: string;
    confirmTone?: 'danger' | 'warning' | 'success' | 'neutral';
    pendingLabel?: string;
    pending?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

const toneClasses: Record<NonNullable<ConfirmModalProps['confirmTone']>, string> = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    neutral: 'bg-slate-800 hover:bg-slate-700',
};

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel,
    confirmTone = 'neutral',
    pendingLabel = 'Memproses...',
    pending = false,
    onCancel,
    onConfirm,
}: ConfirmModalProps) {
    const canUseDOM = typeof window !== 'undefined';

    if (!open || !canUseDOM) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">{message}</div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={pending}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={pending}
                        className={`rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 ${toneClasses[confirmTone]}`}
                    >
                        {pending ? pendingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
