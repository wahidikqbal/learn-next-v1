'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Block } from '@/app/components/editor/types/editor';
import { schemaMap } from '@/app/components/editor/schemas/schema';
import { defaultTemplates } from '@/app/components/templates/defaults';
import type { Template } from '@/app/components/templates/types';
import EditorSidebar from '@/app/components/editor/EditorSidebar';
import EditorToolbar from '@/app/components/editor/EditorToolbar';
import EditorCanvas from '@/app/components/editor/EditorCanvas';
import ResetModal from '@/app/components/editor/ResetModal';
import EditorLoadingScreen from '@/app/components/editor/EditorLoadingScreen';
import TemplateSelector from '@/app/components/templates/TemplateSelector';

type EditorPropValue = string | number | boolean;
type EditorProps = Record<string, EditorPropValue>;

const FALLBACK_BLOCKS: Block[] = [
    { id: 'hero', type: 'hero', props: { heading: 'Start with a Template', subheading: 'Edit sesuai kebutuhan Anda.', align: 'center' } },
];

function EditPageContent() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('templateId');

    const initialTemplate = useMemo(
        () => defaultTemplates.find((template) => template.id === templateId),
        [templateId]
    );

    const [blocks, setBlocks] = useState<Block[]>(
        initialTemplate ? initialTemplate.blocks.map((block) => ({ ...block })) : FALLBACK_BLOCKS
    );
    const [openId, setOpenId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [zoom, setZoom] = useState(1);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; blockId: string | null }>({
        isOpen: false,
        blockId: null,
    });

    const pageName = initialTemplate ? initialTemplate.name : 'Custom Website';

    useEffect(() => {
        localStorage.setItem('preview_blocks', JSON.stringify(blocks));
    }, [blocks]);

    const handleUpdateProps = useCallback((id: string, newProps: EditorProps) => {
        setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, props: { ...block.props, ...newProps } } : block)));
    }, []);

    const toggleVisibility = useCallback((id: string) => {
        setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, hidden: !block.hidden } : block)));
    }, []);

    const handleLoadTemplate = useCallback((template: Template) => {
        setBlocks(template.blocks.map((block) => ({ ...block })));
        setShowTemplateSelector(false);
        setOpenId(null);
    }, []);

    const confirmReset = useCallback(() => {
        const id = resetModal.blockId;
        if (!id) return;

        const block = blocks.find((item) => item.id === id);
        if (!block) return;

        const schema = schemaMap[block.type];
        const defaultProps: EditorProps = {};
        Object.entries(schema).forEach(([key, field]) => {
            defaultProps[key] = field.defaultValue;
        });

        handleUpdateProps(id, defaultProps);
        setResetModal({ isOpen: false, blockId: null });
    }, [blocks, handleUpdateProps, resetModal.blockId]);

    return (
        <div className="flex h-[dvh] flex-col lg:flex-row bg-white overflow-hidden">
            <EditorSidebar
                blocks={blocks}
                openId={openId}
                setOpenId={setOpenId}
                toggleVisibility={toggleVisibility}
                triggerReset={(id) => setResetModal({ isOpen: true, blockId: id })}
                handleUpdateProps={handleUpdateProps}
                schemaMap={schemaMap}
                className="hidden lg:flex"
            />

            <main className="flex-1 min-h-0 flex flex-col bg-[#f3f4f6]">
                <EditorToolbar
                    publishMode="custom"
                    pageName={pageName}
                    templateId={initialTemplate?.id ?? 'custom'}
                    storageKey="preview_blocks"
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    zoom={zoom}
                    setZoom={setZoom}
                    handleOpenLivePreview={() => window.open('/preview', '_blank')}
                    onOpenTemplateSelector={() => setShowTemplateSelector(true)}
                />

                <EditorCanvas
                    blocks={blocks}
                    viewMode={viewMode}
                    zoom={zoom}
                    schemaMap={schemaMap}
                />
            </main>

            <ResetModal
                isOpen={resetModal.isOpen}
                onClose={() => setResetModal({ isOpen: false, blockId: null })}
                onConfirm={confirmReset}
            />
            <TemplateSelector
                isOpen={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelect={handleLoadTemplate}
            />
        </div>
    );
}

export default function EditPage() {
    return (
        <Suspense fallback={<EditorLoadingScreen />}>
            <EditPageContent />
        </Suspense>
    );
}
