import type { ChangeEventHandler } from 'react';
import { Search, X } from 'lucide-react';

type SearchFieldProps = {
    name?: string;
    value?: string;
    defaultValue?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    onClear?: () => void;
    placeholder?: string;
};

export default function SearchField({
    name,
    value,
    defaultValue,
    onChange,
    onClear,
    placeholder = 'Cari...',
}: SearchFieldProps) {
    const showClear = typeof value === 'string' && value.length > 0 && !!onClear;

    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
                type="text"
                name={name}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                placeholder={placeholder}
                className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                    showClear ? 'pr-10' : 'pr-3'
                }`}
            />
            {showClear && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
