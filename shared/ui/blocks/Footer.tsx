type FooterProps = {
    companyName?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    copyright?: string;
    backgroundColor?: string;
    textColor?: string;
};

export default function Footer({
    companyName = 'Dimsum Joss',
    description = 'The best dimsum in town.',
    address = 'Jl. Raya Darmo Permai III No. 88, Surabaya',
    phone = '+62 812-3456-7890',
    email = 'info@dimsumjoss.com',
    copyright = 'Â© 2024 Dimsum Joss. All rights reserved.',
    backgroundColor = '#1f2937',
    textColor = '#ffffff',
}: FooterProps) {
    return (
        <footer
            className="py-12 px-4 md:py-16 md:px-8 transition-colors duration-300"
            style={{ backgroundColor, color: textColor }}
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
                <div className="col-span-1 lg:col-span-2">
                    <h3 className="text-2xl font-bold mb-4">{companyName}</h3>
                    <p className="opacity-70 max-w-sm mb-6 leading-relaxed">{description}</p>
                </div>

                <div>
                    <h4 className="font-bold mb-4 text-lg">Contact</h4>
                    <ul className="space-y-2 opacity-80 text-sm">
                        <li>{phone}</li>
                        <li>{email}</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-4 text-lg">Location</h4>
                    <p className="opacity-80 text-sm leading-relaxed">{address}</p>
                </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center opacity-50 text-sm">
                {copyright}
            </div>
        </footer>
    );
}
