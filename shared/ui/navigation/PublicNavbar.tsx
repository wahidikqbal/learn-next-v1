import Link from 'next/link';
import type { PublicNavItem, TenantTheme } from '@/features/pages/services/page-public.service';
import { resolveTenantTheme } from '@/shared/ui/theme/public-theme';

type PublicNavbarProps = {
    tenantName: string;
    items: PublicNavItem[];
    theme?: TenantTheme;
};

function visibleChildren(item: PublicNavItem): Array<{ id: string; label: string; href: string; hidden?: boolean }> {
    return (item.items ?? []).filter((child) => !child.hidden);
}

export default function PublicNavbar({ tenantName, items, theme }: PublicNavbarProps) {
    if (items.length === 0) {
        return null;
    }

    const resolvedTheme = resolveTenantTheme(theme);

    return (
        <header
            className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
            style={{ borderBottomColor: `${resolvedTheme.primaryColor}33` }}
        >
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="text-sm font-bold tracking-wide"
                    style={{ color: resolvedTheme.primaryColor }}
                >
                    {tenantName}
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                    {items.map((item) => {
                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href ?? '/'}
                                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100"
                                    style={{ color: resolvedTheme.textColor }}
                                >
                                    {item.label}
                                </Link>
                            );
                        }

                        const children = visibleChildren(item);
                        if (children.length === 0) {
                            return null;
                        }

                        if (item.type === 'mega_menu') {
                            return (
                                <details key={item.id} className="group relative">
                                    <summary
                                        className="list-none cursor-pointer rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100"
                                        style={{ color: resolvedTheme.textColor }}
                                    >
                                        {item.label}
                                    </summary>
                                    <div className="absolute left-1/2 top-12 w-[30rem] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                                        <div className="grid grid-cols-2 gap-2">
                                            {children.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={child.href}
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                                                    style={{ color: resolvedTheme.textColor }}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            );
                        }

                        return (
                            <details key={item.id} className="group relative">
                                <summary
                                    className="list-none cursor-pointer rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100"
                                    style={{ color: resolvedTheme.textColor }}
                                >
                                    {item.label}
                                </summary>
                                <div className="absolute right-0 top-12 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    {children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={child.href}
                                            className="block rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                                            style={{ color: resolvedTheme.textColor }}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            </details>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
