import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

type TestimonialGridProps = {
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    t1Name?: string;
    t1Role?: string;
    t1Quote?: string;
    t2Name?: string;
    t2Role?: string;
    t2Quote?: string;
    t3Name?: string;
    t3Role?: string;
    t3Quote?: string;
};

export default function TestimonialGrid({
    title = 'What They Say',
    backgroundColor = '#f9fafb',
    textColor = '#1f2937',
    t1Name = 'Alice Mon', t1Role = 'Food Vlogger', t1Quote = 'Absolutely delicious! The best dimsum I have ever had.',
    t2Name = 'Bob Smith', t2Role = 'Chef', t2Quote = 'Authentic taste and premium quality ingredients.',
    t3Name = 'Charlie Day', t3Role = 'Entrepreneur', t3Quote = 'Professional service and consistent quality for my business.',
}: TestimonialGridProps) {
    const testimonials = [
        { name: t1Name, role: t1Role, quote: t1Quote },
        { name: t2Name, role: t2Role, quote: t2Quote },
        { name: t3Name, role: t3Role, quote: t3Quote },
    ].filter((t) => t.name && t.name.trim() !== '');

    return (
        <section
            className="py-12 px-4 md:py-20 md:px-8 transition-colors duration-300"
            style={{ backgroundColor, color: textColor }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.map((t, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                'bg-white p-6 md:p-8 rounded-2xl shadow-md relative',
                                'hover:shadow-lg transition-shadow duration-300'
                            )}
                        >
                            <Quote className="absolute top-6 left-6 text-gray-200" size={40} />
                            <p className="relative z-10 text-gray-600 mb-6 leading-relaxed italic">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                                    <span className="text-xs text-gray-500">{t.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
