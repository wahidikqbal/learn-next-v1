type TitleProps = {
    text?: string;
    level?: 'h1' | 'h2' | 'h3';
    color?: string;
    align?: 'left' | 'center' | 'right';
};

export default function Title({
    text = 'Default Title',
    level = 'h1',
    color = '#000000',
    align = 'left',
}: TitleProps) {
    const Tag = level;

    const sizeClasses = {
        h1: 'text-4xl font-extrabold',
        h2: 'text-3xl font-bold',
        h3: 'text-2xl font-semibold',
    };

    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <Tag
            className={`${sizeClasses[level]} ${alignClasses[align]} py-4`}
            style={{ color }}
        >
            {text}
        </Tag>
    );
}
