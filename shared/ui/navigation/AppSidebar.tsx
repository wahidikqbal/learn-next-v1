import Link from 'next/link';
import {
    LayoutGrid,
    Globe,
    CreditCard,
    BarChart3,
    FolderKanban,
    Shield,
    Store,
} from 'lucide-react';
import { signOutAction } from '@/app/dashboard/actions';

type SidebarActive = 'dashboard' | 'websites' | 'templates' | 'admin';

type SidebarUser = {
    name: string;
    email: string;
    image: string;
};

type AppSidebarProps = {
    active: SidebarActive;
    user: SidebarUser;
    isAdmin: boolean;
    footerLink: {
        href: string;
        label: string;
    };
};

export default function AppSidebar({ active, user, isAdmin, footerLink }: AppSidebarProps) {
    const mainNavItems = [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, href: '/dashboard', disabled: false },
        { key: 'websites', label: 'Websites', icon: Globe, href: '/websites', disabled: false },
        { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, href: '', disabled: true },
        { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '', disabled: true },
    ] as const;

    const otherNavItems = [
        { key: 'templates', label: 'Templates', icon: FolderKanban, href: '/templates' },
        ...(isAdmin ? [{ key: 'admin', label: 'Admin', icon: Shield, href: '/admin' }] : []),
    ] as const;

    return (
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
            <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
                <Store className="text-blue-600" size={22} />
                <span className="text-2xl font-bold text-slate-900">page builder</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pt-5">
                <p className="px-3 text-xs font-semibold tracking-wide text-slate-400">MAIN</p>
                <nav className="mt-2 space-y-1.5">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        if (item.disabled) {
                            return (
                                <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400">
                                    <span className="flex items-center gap-3">
                                        <Icon size={18} />
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">Soon</span>
                                </div>
                            );
                        }

                        const isActive = active === item.key;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <p className="mt-8 px-3 text-xs font-semibold tracking-wide text-slate-400">OTHER</p>
                <nav className="mt-2 space-y-1.5 pb-4">
                    {otherNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.key;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-slate-200 p-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-12 w-12 rounded-full border-2 border-white bg-cover bg-center bg-slate-200 shadow-sm"
                            style={{ backgroundImage: `url('${user.image}')` }}
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                            <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'}`}>
                                {isAdmin ? 'ADMIN' : 'USER'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                            href={footerLink.href}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                            {footerLink.label}
                        </Link>
                        <form action={signOutAction}>
                            <button
                                type="submit"
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </aside>
    );
}
