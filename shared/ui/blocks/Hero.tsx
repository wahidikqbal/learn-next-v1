import { cn } from '@/lib/utils';

type HeroProps = {
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
    padding?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function Hero({
    heading = 'Hero Title',
    subheading = 'Hero subtitle text',
    align = 'center',
    backgroundColor = '#ffffff',
    textColor = '#1f2937',
    padding = 'lg',
}: HeroProps) {
    const alignClass =
        align === 'left'
            ? 'text-left items-start'
            : align === 'right'
                ? 'text-right items-end'
                : 'text-center items-center';

    const paddingClass = {
        sm: 'py-12 px-4 md:py-16 md:px-8',
        md: 'py-16 px-6 md:py-24 md:px-12',
        lg: 'py-20 px-6 md:py-32 md:px-16',
        xl: 'py-24 px-6 md:py-40 md:px-20',
    };

    return (
        <section
            className={cn(
                'w-full transition-all duration-300',
                paddingClass[padding] || paddingClass.lg
            )}
            style={{ backgroundColor, color: textColor }}
        >
            <div className={cn('max-w-4xl mx-auto flex flex-col', alignClass)}>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
                    {heading}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl opacity-90 max-w-2xl leading-relaxed">
                    {subheading}
                </p>
            </div>
        </section>
    );
}
