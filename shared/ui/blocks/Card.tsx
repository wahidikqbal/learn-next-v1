type CardProps = {
    title?: string;
    description?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    hoverEffect?: boolean;
};

export default function Card({
    title = 'Card Title',
    description = 'This is a card description',
    backgroundColor = '#ffffff',
    align = 'left',
    shadow = 'md',
    borderRadius = 'lg',
    hoverEffect = true,
}: CardProps) {
    const alignmentMap = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    const shadowMap = {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
    };

    const radiusMap = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-[32px]',
    };

    return (
        <div
            className={`
                w-full max-w-sm p-8 border border-gray-100/50 
                ${alignmentMap[align]} 
                ${shadowMap[shadow]} 
                ${radiusMap[borderRadius]}
                ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300' : ''}
            `}
            style={{ backgroundColor }}
        >
            <h3 className="text-xl font-bold mb-3 text-gray-900 tracking-tight">{title}</h3>
            <p className="text-base text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}
