import { LucideIcon, Star, ShieldCheck, Zap, Users, Box, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
    star: Star,
    shield: ShieldCheck,
    zap: Zap,
    users: Users,
    box: Box,
    truck: Truck,
};

type Feature = {
    title: string;
    desc: string;
    icon: string;
};

type FeatureGridProps = {
    title?: string;
    subtitle?: string;
    features?: Feature[];
    columns?: '2' | '3' | '4';
    backgroundColor?: string;
    textColor?: string;
    f1Title?: string;
    f1Desc?: string;
    f1Icon?: string;
    f2Title?: string;
    f2Desc?: string;
    f2Icon?: string;
    f3Title?: string;
    f3Desc?: string;
    f3Icon?: string;
    f4Title?: string;
    f4Desc?: string;
    f4Icon?: string;
};

export default function FeatureGrid({
    title = 'Our Features',
    subtitle = 'Why choose us',
    backgroundColor = '#ffffff',
    textColor = '#1f2937',
    columns = '4',
    f1Title = 'Quality', f1Desc = 'Best materials used.', f1Icon = 'star',
    f2Title = 'Speed', f2Desc = 'Fast delivery.', f2Icon = 'zap',
    f3Title = 'Secure', f3Desc = 'Safe packaging.', f3Icon = 'shield',
    f4Title = 'Support', f4Desc = '24/7 assistance.', f4Icon = 'users',
}: FeatureGridProps) {
    const features = [
        { title: f1Title, desc: f1Desc, icon: f1Icon },
        { title: f2Title, desc: f2Desc, icon: f2Icon },
        { title: f3Title, desc: f3Desc, icon: f3Icon },
        { title: f4Title, desc: f4Desc, icon: f4Icon },
    ].filter((f) => f.title && f.title.trim() !== '');

    const gridCols = columns === '2' ? 'md:grid-cols-2' : columns === '3' ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';

    return (
        <section
            className="py-12 px-4 md:py-20 md:px-8 transition-colors duration-300"
            style={{ backgroundColor, color: textColor }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
                    <p className="opacity-70 max-w-2xl mx-auto text-lg">{subtitle}</p>
                </div>

                <div className={cn('grid grid-cols-1 gap-6 md:gap-8', gridCols)}>
                    {features.map((feature, idx) => {
                        const Icon = iconMap[feature.icon] || Star;
                        return (
                            <div key={idx} className="p-6 rounded-xl bg-white/5 border border-black/5 hover:border-black/20 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-4">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="opacity-70 leading-relaxed">{feature.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
