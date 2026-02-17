'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { defaultTemplates } from '@/app/components/templates/defaults';
import { getRootDomain } from '@/shared/config/env';

type CreatePageFormProps = {
    initialTemplateId?: string;
    action: (formData: FormData) => void | Promise<void>;
};

function toSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function CreatePageForm({ initialTemplateId, action }: CreatePageFormProps) {
    const rootDomain = getRootDomain();
    const resolvedDefaultTemplateId = useMemo(() => {
        if (!initialTemplateId) return defaultTemplates[0]?.id ?? '';
        const found = defaultTemplates.find((template) => template.id === initialTemplateId);
        return found?.id ?? defaultTemplates[0]?.id ?? '';
    }, [initialTemplateId]);

    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [templateId, setTemplateId] = useState(resolvedDefaultTemplateId);
    const [isSubdomainManuallyEdited, setIsSubdomainManuallyEdited] = useState(false);

    return (
        <form action={action} className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama halaman</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={name}
                        onChange={(event) => {
                            const value = event.target.value;
                            setName(value);
                            if (!isSubdomainManuallyEdited) {
                                setSubdomain(toSlug(value));
                            }
                        }}
                        placeholder="Contoh: Landing Product A"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Subdomain</label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-300">
                        <input
                            type="text"
                            name="subdomain"
                            required
                            minLength={3}
                            maxLength={63}
                            value={subdomain}
                            onChange={(event) => {
                                const rawValue = event.target.value;
                                const sanitizedValue = toSlug(rawValue);
                                setSubdomain(sanitizedValue);
                                setIsSubdomainManuallyEdited(rawValue.trim() !== '');
                            }}
                            placeholder="contoh: product-a"
                            className="w-full px-3 py-2 text-sm outline-none"
                        />
                        <span className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-l border-gray-200">
                            .{rootDomain}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Hanya huruf kecil, angka, dan tanda `-`.</p>
                </div>
            </div>

            <div>
                <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">Pilih template</label>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Klik kartu template untuk melihat gambaran style sebelum membuat halaman.
                    </p>
                </div>
                <input type="hidden" name="templateId" value={templateId} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {defaultTemplates.map((template) => {
                        const selected = templateId === template.id;
                        return (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => setTemplateId(template.id)}
                                className={`rounded-xl border text-left transition ${selected
                                    ? 'border-blue-600 ring-2 ring-blue-100'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`h-24 rounded-t-xl ${template.thumbnail} p-3`}>
                                    <div className="h-2 w-2/3 rounded bg-white/80" />
                                    <div className="mt-2 space-y-1">
                                        <div className="h-1.5 w-full rounded bg-white/70" />
                                        <div className="h-1.5 w-5/6 rounded bg-white/70" />
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{template.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-blue-900 font-medium flex items-center gap-1.5">
                        <Sparkles size={14} />
                        Butuh inspirasi lebih banyak?
                    </p>
                    <a
                        href="/templates"
                        className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-500 hover:text-blue-50 transition"
                    >
                        Lihat semua template
                    </a>
                </div>
            </div>

            <div className="flex items-center justify-center pt-1">
                <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700"
                >
                    <ArrowRight size={16} />
                    Create dan Edit
                </button>
            </div>
        </form>
    );
}
