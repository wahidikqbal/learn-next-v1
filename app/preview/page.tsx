// app/preview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageRenderer, { Block } from '../components/PageRenderer';
import { schemaMap } from '../components/editor/schemaMap';
import PreviewLoadingScreen from '@/app/components/ui/PreviewLoadingScreen';

export default function PreviewPage() {
    const searchParams = useSearchParams();
    const pageId = searchParams.get('pageId');
    const storageKey = pageId ? `preview_blocks_${pageId}` : 'preview_blocks';

    // 1. Inisialisasi dengan null atau array kosong
    const [blocks, setBlocks] = useState<Block[] | null>(null);

    useEffect(() => {
        // Fungsi untuk mengambil data
        const loadData = () => {
            const savedBlocks = localStorage.getItem(storageKey);
            if (savedBlocks) {
                try {
                    const parsed = JSON.parse(savedBlocks);
                    setBlocks(parsed);
                } catch (e) {
                    console.error("Gagal parse data preview", e);
                    setBlocks([]);
                }
            } else {
                setBlocks([]);
            }
        };

        // Load data saat pertama kali mount
        loadData();

        // 2. Listener untuk sinkronisasi antar tab (Real-time)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey) {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [storageKey]);

    // 3. Tampilkan loading selama blocks masih null (proses sinkronisasi)
    // Ini mencegah render "setengah matang" yang memicu cascading renders
    if (blocks === null) {
        return <PreviewLoadingScreen />;
    }

    return (
        <main className="min-h-screen bg-white">
            <PageRenderer blocks={blocks} schemaMap={schemaMap} />
        </main>
    );
}
