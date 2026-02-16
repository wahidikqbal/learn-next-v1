/* eslint-disable @next/next/no-img-element */

interface ImageProps {
    src?: string;
    alt?: string;
    caption?: string;
    align?: 'left' | 'center' | 'right';
}

export default function Image({
    src = 'https://placehold.co/600x400',
    alt = 'Placeholder Image',
    caption,
    align = 'center',
}: ImageProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <div className={`w-full p-4 ${alignClass[align]}`}>
            <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-md inline-block"
            />
            {caption && (
                <p className="mt-2 text-sm text-gray-500 italic">
                    {caption}
                </p>
            )}
        </div>
    );
}
