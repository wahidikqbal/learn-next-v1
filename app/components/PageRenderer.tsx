import { componentRegistry } from './editor/schemas/registry';
import { validateProps } from './editor/validateProps';
import { Field } from './editor/types/editor';
import { BlockType } from './editor/types/editor';
import { Block } from './editor/types/editor';
// import { Block, BlockType } from './editor/types/editor';
// import { Field } from './editor/types/editor';

// type BlockType = 'hero' | 'card' | 'button' | 'title' | 'image' | 'featureGrid' | 'testimonialGrid' | 'footer';

// type Block = {
//     id: string;
//     type: BlockType;
//     props: Record<string, string>;
//     hidden?: boolean;
// };

export default function PageRenderer({
    blocks,
    schemaMap,
}: {
    blocks: Block[];
    schemaMap: Record<BlockType, Record<string, Field>>;
}) {
    return (
        <div className="space-y-8">
            {blocks.map((block) => {
                if (block.hidden) return null;

                const Component = componentRegistry[block.type];
                const schema = schemaMap[block.type];

                // if (!Component || !schema) return null; // Safety check for missing components or schemas 
                
                if (!Component || !schema) {
                    console.warn(`Invalid block type: ${block.type}`);
                    return null;
                } // for DEBUGGING PURPOSES


                const safeProps = validateProps(schema, block.props);

                return (
                    <Component
                        key={block.id}
                        {...safeProps}
                    />

                );

            })}
        </div>
    );
}

export type { Block, BlockType };
