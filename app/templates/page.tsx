'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, ArrowRight, ExternalLink } from 'lucide-react';
import { defaultTemplates } from '../components/templates/defaults';
import { Template, TemplateCategory, TEMPLATE_CATEGORIES, } from '../components/templates/types';
import { useMemo, useState } from 'react';
import SearchField from '@/shared/ui/inputs/SearchField';

export default function TemplatesPage() {
    const router = useRouter();

    // 🔥 FILTER LOGIC (DIPAKAI)
    const [activeCategory, setActiveCategory] =
        useState<TemplateCategory>('all');
    const [search, setSearch] = useState('');

    const filteredTemplates = useMemo(() => {
        return defaultTemplates.filter((template: Template) => {
            const matchCategory =
                activeCategory === 'all' ||
                template.category === activeCategory;

            const matchSearch =
                template.name.toLowerCase().includes(search.toLowerCase()) ||
                template.description.toLowerCase().includes(search.toLowerCase());

            return matchCategory && matchSearch;
        });
    }, [activeCategory, search]);

    const navigateWithAuthGuard = async (target: string) => {
        try {
            const response = await fetch('/api/auth/session', { cache: 'no-store' });
            if (!response.ok) {
                router.push('/login');
                return;
            }

            const session = (await response.json()) as { user?: { id?: string } } | null;
            if (!session?.user?.id) {
                router.push('/login');
                return;
            }

            router.push(target);
        } catch {
            router.push('/login');
        }
    };

    const handleSelectTemplate = async (templateId: string) => {
        await navigateWithAuthGuard(`/edit?templateId=${templateId}`);
    };

    // Fungsi untuk membuka preview di tab baru, HARUS DIGANTI
    const handleOpenLivePreview = (templateId: string) => {
        const url = `/preview?templateId=${templateId}`
        window.open(url, "_blank", "noopener,noreferrer")
    }


    return (
        <div className="min-h-screen bg-gray-50 font-(family-name:--font-geist-sans)">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                            <LayoutTemplate className="text-blue-600" />
                            <span>PageBuilder</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose a Template</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Start with a pre-designed layout or build from scratch. You can fully customize every aspect of these templates in the editor.
                    </p>
                </div>

                {/* Search + Category */}
                <div className="max-w-3xl mx-auto mb-12 space-y-5">
                    {/* Search */}
                    <SearchField
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari template, industri..."
                    />

                    {/* Category Pills */}
                    <div className="w-full rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveCategory(cat.key)}
                                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold leading-tight transition-all sm:text-sm ${activeCategory === cat.key
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="wrap-break-words text-center">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Blank Canvas Option */}
                    <div onClick={() => void navigateWithAuthGuard('/edit')}
                        className="group cursor-pointer bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center min-h-75">
                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Blank Canvas</h3>
                        <p className="text-gray-500 text-center text-sm">Start from scratch with an empty page</p>
                    </div>

                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => void handleSelectTemplate(template.id)}
                            className="group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-500/50 transition-all transform hover:-translate-y-1"
                        >
                            {/* Thumbnail */}
                            <div className={`h-48 ${template.thumbnail} relative overflow-hidden flex items-center justify-center`}>
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />

                                <div className="w-3/4 h-3/4 bg-white shadow-lg rounded-lg p-3 opacity-60 scale-95 group-hover:scale-100 transition-transform duration-300">
                                    <div className="h-3 w-1/3 bg-gray-200 rounded mb-3"></div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                                        <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                                        <div className="h-2 w-4/6 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                                 
                                {/* CTA  */}
                                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-linear-to-t from-black/50 to-transparent flex justify-center gap-3">
                                    {/* Preview */}
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleOpenLivePreview(template.id)
                                        }}
                                        className="px-4 py-2 bg-white/90 text-gray-900 font-bold rounded-full text-sm shadow-lg flex items-center gap-2 cursor-pointer hover:bg-white transition-colors hover:transform hover:scale-105"
                                    >
                                        <ExternalLink size={14} />
                                        Preview
                                    </div>

                                    {/* Use template */}
                                    <div className="px-4 py-2 bg-blue-600 text-white font-bold rounded-full text-sm shadow-lg flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors hover:transform hover:scale-105">
                                        Use Template <ArrowRight size={14} />
                                    </div>
                                </div>

                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-blue-600 transition-colors">
                                    {template.name}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {template.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
