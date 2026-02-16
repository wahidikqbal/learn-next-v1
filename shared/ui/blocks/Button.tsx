export interface ButtonProps {
    label?: string;
    href?: string;
    color?: string;
    textColor?: string;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export default function Button({
    label = 'Click Me',
    href = 'https://google.com',
    color = '#3b82f6',
    textColor = '#ffffff',
    variant = 'solid',
    size = 'md',
    borderRadius = 'lg',
}: ButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-8 py-3.5 text-lg',
    };

    const radiusClasses = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
    };

    const baseStyles = 'font-semibold inline-block transition-all duration-200 transform active:scale-95';

    let variantStyles = {};
    if (variant === 'solid') {
        variantStyles = {
            backgroundColor: color,
            color: textColor,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        };
    } else if (variant === 'outline') {
        variantStyles = {
            backgroundColor: 'transparent',
            color,
            border: `2px solid ${color}`,
        };
    } else if (variant === 'ghost') {
        variantStyles = {
            backgroundColor: 'transparent',
            color,
        };
    }

    return (
        <a
            href={href}
            target="_blank"
            className={`${baseStyles} ${sizeClasses[size]} ${radiusClasses[borderRadius]} hover:opacity-90`}
            style={variantStyles}
        >
            {label}
        </a>
    );
}
