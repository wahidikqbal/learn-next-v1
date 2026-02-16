'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastOptions = {
    title?: string;
    tone?: ToastTone;
    durationMs?: number;
};

type ToastPhase = 'entering' | 'visible' | 'exiting';

type ToastItem = {
    id: number;
    title?: string;
    message: string;
    tone: ToastTone;
    durationMs: number;
    phase: ToastPhase;
};

type ToastTimers = {
    enter?: ReturnType<typeof setTimeout>;
    dismiss?: ReturnType<typeof setTimeout>;
    remove?: ReturnType<typeof setTimeout>;
};

type ToastContextValue = {
    showToast: (message: string, toneOrOptions?: ToastTone | ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION_MS = 3200;
const EXIT_ANIMATION_MS = 220;
const MAX_VISIBLE_TOASTS = 5;

const toneClassMap: Record<ToastTone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-slate-200 bg-white text-slate-900',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timersRef = useRef<Map<number, ToastTimers>>(new Map());

    const clearToastTimers = useCallback((id: number) => {
        const timers = timersRef.current.get(id);
        if (!timers) return;

        if (timers.enter) clearTimeout(timers.enter);
        if (timers.dismiss) clearTimeout(timers.dismiss);
        if (timers.remove) clearTimeout(timers.remove);
        timersRef.current.delete(id);
    }, []);

    const removeToastImmediately = useCallback((id: number) => {
        clearToastTimers(id);
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, [clearToastTimers]);

    const startExit = useCallback(
        (id: number) => {
            const timers = timersRef.current.get(id) ?? {};
            if (timers.dismiss) {
                clearTimeout(timers.dismiss);
                timers.dismiss = undefined;
            }
            if (timers.enter) {
                clearTimeout(timers.enter);
                timers.enter = undefined;
            }
            if (timers.remove) {
                return;
            }

            setToasts((prev) =>
                prev.map((toast) => (toast.id === id ? { ...toast, phase: 'exiting' as ToastPhase } : toast))
            );

            timers.remove = setTimeout(() => {
                removeToastImmediately(id);
            }, EXIT_ANIMATION_MS);

            timersRef.current.set(id, timers);
        },
        [removeToastImmediately]
    );

    const scheduleLifecycle = useCallback(
        (id: number, durationMs: number) => {
            const timers = timersRef.current.get(id) ?? {};

            timers.enter = setTimeout(() => {
                setToasts((prev) =>
                    prev.map((toast) => (toast.id === id ? { ...toast, phase: 'visible' as ToastPhase } : toast))
                );
            }, 16);

            timers.dismiss = setTimeout(() => {
                startExit(id);
            }, durationMs);

            timersRef.current.set(id, timers);
        },
        [startExit]
    );

    const showToast = useCallback(
        (message: string, toneOrOptions: ToastTone | ToastOptions = 'info') => {
            const options: ToastOptions =
                typeof toneOrOptions === 'string' ? { tone: toneOrOptions } : toneOrOptions;
            const id = Date.now() + Math.floor(Math.random() * 1000);
            const nextToast: ToastItem = {
                id,
                title: options.title,
                message,
                tone: options.tone ?? 'info',
                durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
                phase: 'entering',
            };

            setToasts((prev) => {
                const next = [...prev, nextToast];
                if (next.length <= MAX_VISIBLE_TOASTS) return next;

                const overflow = next.slice(0, next.length - MAX_VISIBLE_TOASTS);
                for (const toast of overflow) {
                    clearToastTimers(toast.id);
                }
                return next.slice(-MAX_VISIBLE_TOASTS);
            });

            scheduleLifecycle(id, nextToast.durationMs);
        },
        [clearToastTimers, scheduleLifecycle]
    );

    useEffect(() => {
        const timers = timersRef.current;

        return () => {
            for (const timerSet of timers.values()) {
                if (timerSet.enter) clearTimeout(timerSet.enter);
                if (timerSet.dismiss) clearTimeout(timerSet.dismiss);
                if (timerSet.remove) clearTimeout(timerSet.remove);
            }
            timers.clear();
        };
    }, []);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2"
            >
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onClose={() => startExit(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
    const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info;
    const motionClass =
        toast.phase === 'visible'
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-4 opacity-0 scale-[0.98]';

    return (
        <div
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg transition-all duration-200 ease-out will-change-transform ${motionClass} ${toneClassMap[toast.tone]}`}
            role="status"
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-xs font-semibold">{toast.title}</p> : null}
                <p className="break-words">{toast.message}</p>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="rounded p-0.5 text-current/70 hover:bg-black/5 hover:text-current"
                aria-label="Tutup notifikasi"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }

    return context;
}
